function ollama#custom#set_func_arg(function_name, arg_name, value)
  call denops#request("ollama", "params:set-one", [a:function_name, a:arg_name, a:value])
endfunction

function ollama#custom#patch_func_args(function_name, args)
  call denops#request("ollama", "params:set-for-method", [a:function_name, a:args])
endfunction
