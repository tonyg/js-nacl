var nacl_factory = {
  instantiate: function (on_ready, optionsOpt) {
    var options = optionsOpt || {};
    var requested_total_memory = options.requested_total_memory || 33554432;
    var undefined_reference_value = (function (v) { return v; })();

    if (typeof on_ready !== 'function') {
      throw new Error("nacl_factory: Expects on_ready callback as first argument. New in v1.1.0.");
    }

    return (function (window, document) {
      var on_ready_call_needed = false;
      var Module = {
        TOTAL_MEMORY: requested_total_memory,
        onRuntimeInitialized: function () {
          if (nacl) {
            on_ready(nacl);
          } else {
            on_ready_call_needed = true;
          }
        }
      };
      if (options.memoryInitializerPrefixURL) {
        Module.memoryInitializerPrefixURL = options.memoryInitializerPrefixURL;
      }
      var nacl_raw = Module;
