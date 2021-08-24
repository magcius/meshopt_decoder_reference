The task at hand is to create a reference decoder in JavaScript, following spec.md for implementation, and creating decoder.js.

decoder.js should implement an object with three functions with the following signatures:

```
    decodeVertexBuffer: (target: Uint8Array, count: number, size: number, source: Uint8Array, filter?: string) => void;
    decodeIndexBuffer: (target: Uint8Array, count: number, size: number, source: Uint8Array) => void;
    decodeIndexSequence: (target: Uint8Array, count: number, size: number, source: Uint8Array) => void;
```

The `filter` argument to `decodeVertexBuffer` is one of `"NONE", "OCTAHEDRAL", "QUATERNION", "EXPONENTIAL"`. The encoding is explained in the spec; `undefined` is the same as `"NONE"`.

The three functions correspond to three encodings described in the spec - `decodeVertexBuffer` corresponds to `"ATTRIBUTES"`, `decodeIndexBuffer` corresponds to `"TRIANGLES"`, `decodeIndexSequence` corresponds to `"INDICES"`.

Your goal is to create a reference decoder - correctness is important, but performance is not important. Note that today there exists a reference implementation in C++.
The idea behind creating a reference decoder is both to have an easy-to-follow implementation, but also to validate correctness of the spec - the spec was written based on the C++ implementation, so it may contain errors.

When the spec is found to contain ambiguities, please edit the spec to note or resolve them.
When you're having trouble getting the implementation based on the spec to pass, you can consult the reference C++ implementation (https://github.com/zeux/meshoptimizer/blob/master/src/vertexcodec.cpp, https://github.com/zeux/meshoptimizer/blob/master/src/indexcodec.cpp, https://github.com/zeux/meshoptimizer/blob/master/src/vertexfilter.cpp).
However, please only do so if you're stuck and can't follow the spec - and if you figure out the issue, please edit the spec to match the actual implementation.

The output of your work should be a repository that's a fork of this one, with a new file, `decoder.js`, that makes tests pass, and edits to `spec.md` if any are required.
Your reference implementation should have no dependencies and be written in pre-ES JS (sorry). It should be commented when necessary with references to spec. It should not use any node.js-specific primitives.

If your work is complete, the reward - a used but still functional RTX 2080 - will be sent to the address of choice inside USA, with the sender (me) paying shipping.
