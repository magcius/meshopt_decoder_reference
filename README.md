Goal
===

This repository contains the information about an assignment, which is to create a reference decoder for the bitstream format used by EXT_meshopt_compression glTF extension.
While a C++ implementation exists, the spec was written by the author of that implementation (me). As such, the spec may contain inaccuracies and omissions - the purpose of this work is to make sure that it's possible to build a reference decoder purely by following the spec, which must be done by someone else to ensure purity of implementation.

Assignment
===

The task at hand is to create a reference decoder in JavaScript, following spec.md (appendix A and B) and implementing it inside decoder.js.

decoder.js should implement an object with three functions with the following signatures (using TypeScript syntax for clarity only):

```
decodeVertexBuffer: (target: Uint8Array, count: number, size: number, source: Uint8Array, filter?: string) => void;
decodeIndexBuffer: (target: Uint8Array, count: number, size: number, source: Uint8Array) => void;
decodeIndexSequence: (target: Uint8Array, count: number, size: number, source: Uint8Array) => void;
```

The three functions correspond to three encodings described in the spec - `decodeVertexBuffer` corresponds to `"ATTRIBUTES"`, `decodeIndexBuffer` corresponds to `"TRIANGLES"`, `decodeIndexSequence` corresponds to `"INDICES"`.

`size` parameter corresponds to `byteStride` from the spec.

The `filter` argument to `decodeVertexBuffer` is one of `"NONE", "OCTAHEDRAL", "QUATERNION", "EXPONENTIAL"`. The encoding is explained in the spec; `undefined` is the same as `"NONE"`.

Your goal is to create a reference decoder - correctness is important, but performance is not important. Note that today there exists a reference implementation in C++.
The idea behind creating a reference decoder is both to have an easy-to-follow implementation, but also to validate correctness of the spec - the spec was written based on the C++ implementation, so it may contain errors.

The decoder may assume the source contains a valid encoding; when the input is malformed, it's acceptable to produce garbage output or throw an exception.

When the spec is found to contain ambiguities, please edit the spec to note or resolve them.
When you're having trouble getting the implementation based on the spec to pass, you can consult the reference C++ implementation (linked below in rot13 to avoid temptation).
However, please only do so if you're stuck and can't follow the spec - and if you figure out the issue, please edit the spec to match the actual implementation.

The output of your work should be a repository that's a fork of this one, with a new file, `decoder.js`, that makes tests pass, and edits to `spec.md` if any are required.
Your reference implementation should have no dependencies and be written in pre-ES JS (sorry). It should be commented when necessary with references to spec. It should not use any node.js-specific primitives, even though you should use node.js to run tests.

Please note, I can't help you debug your code or explain the spec - since you have tests and matching C++ implementation you must be able to figure it out on your own. Anything you're stuck on that's not obvious from the spec likely necessitates correcting the spec, and I can't do it for you because I wrote all C++ code and the spec so I will naturally gloss over things that are second-nature to me.

Reward & licensing
===

The author estimates the decoder to take ~500 lines of code in JS. If your work is complete - that is, the decoder is passing all the tests and the spec has been edited if clarifications were necessary, the reward - a used but still functional RTX 2080 - will be sent to the address of choice inside USA, with the sender (me) paying shipping. Note that just one of these exists in the world so if you expect it, please contact me first to make sure nobody else is currently doing this expecting to get a GPU.

![image0 (2)](https://user-images.githubusercontent.com/1106629/130547049-e7552139-d513-48b5-b704-e1f3b93c9ff8.jpeg)

By completing this assignment you explicitly transfer the rights to reference decoder and spec changes to me. The decoder may get incorporated into meshoptimizer library and/or glTF spec; the edits to the spec will be incorporated to the glTF repository, with you listed as a contributor given substantial changes. The decoder will still mention you as the original author even if the decoder gets relicensed under meshoptimizer's MIT license.

Reference implementation
===

Please *only* consult this if you're stuck and can't figure out how to implement the spec in a way that passes tests. Please do this after you try to implement all functions, not just during the implementation of the first one.

uggcf://tvguho.pbz/mrhk/zrfubcgvzvmre/oybo/znfgre/fep/iregrkpbqrp.pcc
uggcf://tvguho.pbz/mrhk/zrfubcgvzvmre/oybo/znfgre/fep/vaqrkpbqrp.pcc
uggcf://tvguho.pbz/mrhk/zrfubcgvzvmre/oybo/znfgre/fep/iregrksvygre.pcc
