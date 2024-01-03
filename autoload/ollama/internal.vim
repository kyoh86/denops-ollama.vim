function ollama#internal#callback_helper(denops_name, lambda_id, ...)
  call denops#notify(a:denops_name, a:lambda_id, a:000)
endfunction
