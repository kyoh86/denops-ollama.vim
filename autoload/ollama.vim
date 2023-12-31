" Open log file.
function ollama#open_log()
  call denops#notify("ollama", "open_log", [])
endfunction

" Start chat with Ollama.
function ollama#start_chat(...)
  call denops#notify("ollama", "start_chat", a:000)
endfunction

" Start chat with Ollama within context.
function ollama#start_chat_with_context(...)
  call denops#notify("ollama", "start_chat_with_context", a:000)
endfunction

" Show list models in local.
function ollama#list_models()
  call denops#notify("ollama", "list_models", [])
endfunction

" Pull a model from the library.
function ollama#pull_model(...)
  call denops#notify("ollama", "pull_model", a:000)
endfunction

" Delete a model in local.
function ollama#delete_model(...)
  call denops#notify("ollama", "delete_model", a:000)
endfunction

" Cancell all background jobs.
function ollama#cancel()
  call denops#notify("ollama", "cancel", [])
endfunction
