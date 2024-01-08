function ollama#internal#notify_callback(denops_name, lambda_id, ...)
  call denops#notify(a:denops_name, a:lambda_id, a:000)
endfunction

function ollama#internal#request_callback(denops_name, lambda_id, ...)
  return denops#request(a:denops_name, a:lambda_id, a:000)
endfunction

function ollama#internal#cancel()
  doautocmd User OllamaCancel
  return '<C-c>'
endfunction
