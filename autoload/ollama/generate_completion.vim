function ollama#generate_completion#start(...)
  call denops#notify("ollama", "generate_completion", a:000)
endfunction

function ollama#generate_completion#callback(denops_name, lambda_id, prompt)
  call denops#notify(a:denops_name, a:lambda_id, [a:prompt])
endfunction
