var nacl = require("./build/nacl.js");
var tests = require("./test_nacl.js");

tests.do_tests(nacl, console.log);
