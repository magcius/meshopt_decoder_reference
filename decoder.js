
function dezig(v) {
    return ((v & 1) !== 0) ? ~(v >>> 1) : v >>> 1;
}

function copysign(mag, sign) {
    return Math.abs(mag) * Math.sign(sign);
}

/**
 * @param {Uint8Array} target
 * @param {number} elementCount
 * @param {number} byteStride
 * @param {Uint8Array} source
 * @param {'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL'} filter
 */
exports.decodeVertexBuffer = (target, elementCount, byteStride, source, filter) => {
    if (source[0] !== 0xA0) {
        // Invalid header byte; maybe emit warning?
        return;
    }

    const attrBlockMaxElementCount = Math.min((0x2000 / byteStride) & ~0x000F, 0x100);

    const deltas = new Uint8Array(0x10);

    // XXX(jstpierre): Not sure how best to calculate location of tail -- best I can come up with is source.byteLength,
    // but it's possible we want the user to pass an explicit stream length here?
    const tailDataOffs = source.byteLength - byteStride;

    // what deltas are stored relative to
    const tempData = source.slice(tailDataOffs, tailDataOffs + byteStride);

    let srcOffs = 0x01;

    // Attribute Blocks
    for (let dstElemBase = 0; dstElemBase < elementCount; dstElemBase += attrBlockMaxElementCount) {
        const attrBlockElementCount = Math.min(elementCount - dstElemBase, attrBlockMaxElementCount);
        const groupCount = ((attrBlockElementCount + 0x0F) & ~0x0F) >>> 4;
        const headerByteCount = ((groupCount + 0x03) & ~0x03) >>> 2;

        // Data blocks
        for (let byte = 0; byte < byteStride; byte++) {
            let headerBitsOffs = srcOffs;

            srcOffs += headerByteCount;
            for (let group = 0; group < groupCount; group++) {
                const mode = (source[headerBitsOffs] >>> ((group & 0x03) << 1)) & 0x03;
                if ((group & 0x03) === 0x03)
                    headerBitsOffs++;

                const dstElemGroup = dstElemBase + (group << 4);

                if (mode === 0) {
                    // bits 0: All 16 byte deltas are 0; the size of the encoded block is 0 bytes
                    deltas.fill(0x00);
                } else if (mode === 1) {
                    // bits 1: Deltas are using 2-bit sentinel encoding; the size of the encoded block is [4..20] bytes
                    const srcBase = srcOffs;
                    srcOffs += 0x04;
                    for (let m = 0; m < 0x10; m++) {
                        // 0 = >>> 6, 1 = >>> 4, 2 = >>> 2, 3 = >>> 0
                        const shift = (6 - ((m & 0x03) << 1));
                        delta = (source[srcBase + (m >>> 2)] >>> shift) & 0x03;
                        if (delta === 0x03)
                            delta = source[srcOffs++];
                        deltas[m] = delta;
                    }
                } else if (mode === 2) {
                    // bits 2: Deltas are using 4-bit sentinel encoding; the size of the encoded block is [8..24] bytes
                    const srcBase = srcOffs;
                    srcOffs += 0x08;
                    for (let m = 0; m < 0x10; m++) {
                        // 0 = >>> 4, 1 = >>> 0
                        const shift = (m & 0x01) ? 0 : 4;
                        delta = (source[srcBase + (m >>> 1)] >>> shift) & 0x0F;
                        if (delta === 0x0F)
                            delta = source[srcOffs++];
                        deltas[m] = delta;
                    }
                } else {
                    // bits 3: All 16 byte deltas are stored verbatim; the size of the encoded block is 16 bytes
                    deltas.set(source.subarray(srcOffs, srcOffs + 0x10));
                    srcOffs += 0x10;
                }

                // go through and apply deltas to data
                for (let m = 0; m < 0x10; m++) {
                    const dstElem = dstElemGroup + m;
                    if (dstElem >= elementCount)
                        break;

                    const delta = dezig(deltas[m]);
                    const newValue = tempData[byte] + delta;
                    const dstOffs = dstElem * byteStride + byte;
                    target[dstOffs] = newValue;
                    tempData[byte] = newValue;
                }
            }
        }
    }

    if (filter === 'OCTAHEDRAL') {
        let values, intmax;
        if (byteStride === 4) {
            values = new Int8Array(target.buffer);
            intmax = 127;
        } else if (byteStride === 8) {
            values = new Int16Array(target.buffer);
            intmax = 32767;
        }

        for (let i = 0; i < 4 * elementCount; i += 4) {
            let x = values[i + 0], y = values[i + 1], one = values[i + 2];
            x /= one;
            y /= one;
            let z = 1.0 - Math.abs(x) - Math.abs(y);
            const t = Math.min(z, 0.0);
            x -= copysign(t, x);
            y -= copysign(t, y);
            const h = intmax / Math.hypot(x, y, z);
            values[i + 0] = Math.round(x * h);
            values[i + 1] = Math.round(y * h);
            values[i + 2] = Math.round(z * h);
        }
    } else if (filter === 'QUATERNION') {
        if (byteStride !== 8)
            return;

        const values = new Int16Array(target.buffer);

        for (let i = 0; i < 4 * elementCount; i += 4) {
            const iw = values[i + 3];
            const maxc = iw & 0x03;
            const s = Math.SQRT1_2 / (iw | 0x03);
            let x = values[i + 0] * s;
            let y = values[i + 1] * s;
            let z = values[i + 2] * s;
            let w = Math.sqrt(Math.max(0.0, 1.0 - x**2 - y**2 - z**2));
            values[i + (maxc + 1) % 4] = Math.round(x * 32767);
            values[i + (maxc + 2) % 4] = Math.round(y * 32767);
            values[i + (maxc + 3) % 4] = Math.round(z * 32767);
            values[i + (maxc + 0) % 4] = Math.round(w * 32767);
        }
    } else if (filter === 'EXPONENTIAL') {
        if ((byteStride & 0x03) !== 0x00)
            return;

        const input = new Int32Array(target.buffer);
        const output = new Float32Array(target.buffer);
        for (let i = 0; i < (byteStride * elementCount) / 4; i++) {
            const v = input[i], e = v >> 24, m = (v << 8) >> 8;
            output[i] = 2.0**e * m;
        }
    }
};

/**
 * @param {Uint32Array} fifo
 * @param {number} n
 */
function shiftFIFO(fifo, n) {
    for (let i = fifo.length - 1; i > n - 1; i--)
        fifo[i] = fifo[i - n];
}

/**
 * @param {Uint32Array} fifo
 * @param {number} v
 */
function pushFIFO(fifo, v) {
    shiftFIFO(fifo, 1);
    fifo[0] = v;
}

/**
 * @param {Uint8Array} target
 * @param {number} elementCount
 * @param {number} byteStride
 * @param {Uint8Array} source
 */
exports.decodeIndexBuffer = (target, count, byteStride, source) => {
    if (source[0] !== 0xE1) {
        // Invalid header byte; maybe emit warning?
        return;
    }

    if (count % 3 !== 0)
        return;

    let dst;
    if (byteStride === 2)
        dst = new Uint16Array(target.buffer);
    else if (byteStride === 4)
        dst = new Uint32Array(target.buffer);
    else
        return;

    const triCount = count / 3;
    let codeOffs = 0x01;
    let dataOffs = codeOffs + triCount;
    let codeauxOffs = source.byteLength - 0x10;

    function readLEB128() {
        let n = 0;
        for (let i = 0; ; i += 7) {
            const b = source[dataOffs++];
            n |= (b & 0x7F) << i;

            if (b < 0x80)
                return n;
        }
    }

    let next = 0, last = 0;
    const edgeFIFO = new Uint32Array(32), vertexFIFO = new Uint32Array(16);

    function decodeIndex(v) {
        return (last += dezig(v));
    }

    let dstOffs = 0;
    for (let i = 0; i < triCount; i++) {
        const code = source[codeOffs++];
        const b0 = code >>> 4, b1 = code & 0x0F;

        if (b0 < 0x0F) {
            const a = edgeFIFO[(b0 << 1) + 0], b = edgeFIFO[(b0 << 1) + 1];
            let c = -1;

            if (b1 === 0x00) {
                c = next++;
                pushFIFO(vertexFIFO, c);
            } else if (b1 < 0x0D) {
                c = vertexFIFO[b1];
            } else if (b1 === 0x0D) {
                c = --last;
                pushFIFO(vertexFIFO, c);
            } else if (b1 === 0x0E) {
                c = ++last;
                pushFIFO(vertexFIFO, c);
            } else if (b1 === 0x0F) {
                const v = readLEB128();
                c = decodeIndex(v);
                pushFIFO(vertexFIFO, c);
            }

            shiftFIFO(edgeFIFO, 4);
            edgeFIFO[0] = a; edgeFIFO[1] = c;
            edgeFIFO[2] = c; edgeFIFO[3] = b;

            dst[dstOffs++] = a;
            dst[dstOffs++] = b;
            dst[dstOffs++] = c;
        } else /* if (b0 === 0x0F) */ {
            let a = -1, b = -1, c = -1;

            if (b1 < 0x0E) {
                const e = source[codeauxOffs + b1];
                const z = e >>> 4, w = e & 0x0F;
                a = next++;

                if (z === 0x00)
                    b = next++;
                else
                    b = vertexFIFO[z - 1];

                if (w === 0x00)
                    c = next++;
                else
                    c = vertexFIFO[w - 1];

                pushFIFO(vertexFIFO, a);
                if (z === 0x00)
                    pushFIFO(vertexFIFO, b);
                if (w === 0x00)
                    pushFIFO(vertexFIFO, c);
            } else {
                const e = source[dataOffs++];
                if (e === 0x00)
                    next = 0;

                const z = e >>> 4, w = e & 0x0F;

                if (b1 === 0x0E)
                    a = next++;
                else
                    a = decodeIndex(readLEB128());

                if (z === 0x00)
                    b = next++;
                else if (z === 0x0F)
                    b = decodeIndex(readLEB128());
                else
                    b = vertexFIFO[z - 1];

                if (w === 0x00)
                    c = next++;
                else if (w === 0x0F)
                    c = decodeIndex(readLEB128());
                else
                    c = vertexFIFO[w - 1];

                pushFIFO(vertexFIFO, a);
                if (z === 0x00 || z === 0x0F)
                    pushFIFO(vertexFIFO, b);
                if (w === 0x00 || w === 0x0F)
                    pushFIFO(vertexFIFO, c);
            }

            shiftFIFO(edgeFIFO, 6);
            edgeFIFO[0] = a; edgeFIFO[1] = c;
            edgeFIFO[2] = c; edgeFIFO[3] = b;
            edgeFIFO[4] = b; edgeFIFO[5] = a;

            dst[dstOffs++] = a;
            dst[dstOffs++] = b;
            dst[dstOffs++] = c;
        }
    }
};

exports.decodeIndexSequence = (target, count, byteStride, source) => {
    if (source[0] !== 0xD1) {
        // Invalid header byte; maybe emit warning?
        return;
    }

    let dst;
    if (byteStride === 2)
        dst = new Uint16Array(target.buffer);
    else if (byteStride === 4)
        dst = new Uint32Array(target.buffer);
    else
        return;

    let dataOffs = 0x01;

    function readLEB128() {
        let n = 0;
        for (let i = 0; ; i += 7) {
            const b = source[dataOffs++];
            n |= (b & 0x7F) << i;

            if (b < 0x80)
                return n;
        }
    }

    const last = new Uint32Array(2);

    for (let i = 0; i < count; i++) {
        const v = readLEB128();
        const b = (v & 0x01);
        const delta = dezig(v >>> 1);
        dst[i] = (last[b] += delta);
    }
};
