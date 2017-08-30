var ffi = require('ffi'),
    ref = require('ref');



var voidPtr = ref.refType(ref.types.void);
var stringPtr = ref.refType(ref.types.CString);

var bindings = {
  EnumWindows: ['bool', [voidPtr, 'int32']],
  GetWindowTextA: ['long', ['long', stringPtr, 'long']]
};

var user32 = ffi.Library('user32', bindings);
var windowProc = ffi.Callback('bool', ['long', 'int32'], function (hwnd, lParam) {
  var buf = new Buffer(255);
  var ret = user32.GetWindowTextA(hwnd, buf, 255);
  var name = ref.readCString(buf, 0);
  console.log(name);
  return true;
});

var checkTitles = user32.EnumWindows(windowProc, 0);