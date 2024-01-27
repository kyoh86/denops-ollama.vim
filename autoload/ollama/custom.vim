function ollama#custom#set_func_arg(function_name, arg_name, value)
  call denops#notify("customSetFuncArg", a:function_name, a:arg_name, a:value)
endfunction

function ollama#custom#patch_func_args(function_name, args)
  call denops#notify("customPatchFuncArgs", a:function_name, a:args)
endfunction
