" Open log file.
function ollama#open_log(args)
  call denops#notify("ollama", "openLog", [a:args])
endfunction

" Start chat with Ollama.
function ollama#start_chat(args)
  call denops#notify("ollama", "startChat", [a:args])
endfunction

" Start chat with Ollama within context.
function ollama#start_chat_with_context(args)
  call denops#notify("ollama", "startChatWithContext", [a:args])
endfunction

	
" Get completion for the current buffer around the cursor.
function ollama#complete(args)
  let l:Cb = get(a:args, 'callback')
  if type(l:Cb) == v:t_func
    let l:Cb = denops#callback#register(l:Cb)
  elseif type(l:Cb) == v:t_string
    let l:Cb = denops#callback#register(function(l:Cb))
  endif
  let l:args = a:args
  let l:args['callback'] = l:Cb
  call denops#notify("ollama", "complete", [l:args])
endfunction

" Show list models in local.
function ollama#list_models(args)
  call denops#notify("ollama", "listModels", [a:args])
endfunction

" Pull a model from the library.
function ollama#pull_model(args)
  call denops#notify("ollama", "pullModel", [a:args])
endfunction

" Delete a model in local.
function ollama#delete_model(args)
  call denops#notify("ollama", "deleteModel", [a:args])
endfunction
