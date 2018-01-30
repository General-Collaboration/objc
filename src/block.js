const ffi = require('ffi');
const struct = require('ref-struct');
const runtime = require('./runtime');
const types = require('./types');

var __block_literal = struct({
  isa: 'pointer',
  flags: 'int32',
  reserved: 'int32',
  invoke: 'pointer',
  descriptor: 'pointer'
});

var __block_descriptor = struct({
  reserved: 'ulonglong',
  Block_size: 'ulonglong'
});


class Block {
  constructor(fn, returnType, argumentTypes) {

    if (typeof fn !== 'function' || typeof returnType !== 'string' || argumentTypes === undefined) {
      throw new TypeError('Invalid arguments passed to Block constructor');
    }

    this.fn = fn;
    this.returnType = types[returnType];
    this.argumentTypes = argumentTypes;
    this.argumentTypes.splice(0, 0, '@'); // 1st argument is the block itself
    this.argumentTypes = this.argumentTypes.map(type => types[type]);
  }

  makeBlock() {
    const self = this;
    var callback = ffi.Callback(this.returnType, this.argumentTypes, function() {
      // call the block implementation, skipping the 1st parameter (the block itself)
      return self.fn.apply(null, Array.from(arguments).slice(1));
    });

    var block = new __block_literal();

    block.isa = runtime.getConstant('_NSConcreteGlobalBlock');
    block.flags = 1 << 29;
    block.reserved = 0;
    block.invoke = callback;
    //block.descriptor = ... // TODO can we get away w/out setting the descriptor?

    return block.ref();
  }
}

module.exports = Block;