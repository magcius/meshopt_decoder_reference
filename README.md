Goal
===

This repository contains the information about an assignment, which is to create a reference decoder for the bitstream format used by EXT_meshopt_compression glTF extension.
While a C++ implementation exists, the spec was written by the author of that implementation (me). As such, the spec may contain inaccuracies and omissions - the purpose of this work is to make sure that it's possible to build a reference decoder purely by following the spec, which must be done by someone else to ensure purity of implementation.

Assignment
===

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

Please note, I can't help you debug your code or explain the spec - since you have tests and matching C++ implementation you must be able to figure it out on your own. Anything you're stuck on that's not obvious from the spec likely necessitates correcting the spec, and I can't do it for you because I wrote all C++ code and the spec so I will naturally gloss over things that are second-nature to me.

Reward & licensing
===

If your work is complete, the reward - a used but still functional RTX 2080 - will be sent to the address of choice inside USA, with the sender (me) paying shipping.

![image0 (2)](https://user-images.githubusercontent.com/1106629/130547049-e7552139-d513-48b5-b704-e1f3b93c9ff8.jpeg)

By completing this assignment you explicitly transfer the rights to reference decoder and spec changes to me. The decoder may get incorporated into meshoptimizer library and/or glTF spec; the edits to the spec will be incorporated to the glTF repository, with you listed as a contributor given substantial changes. The decoder will still mention you as the original author even if the decoder gets relicensed under meshoptimizer's MIT license.
