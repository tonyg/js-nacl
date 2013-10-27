var nacl_factory = require("./lib/nacl_factory.js");
var tests = require("./test_nacl.js");

tests.do_tests(nacl_factory.instantiate(), console.log);
