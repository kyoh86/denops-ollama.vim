" Start chat with Ollama.
" Parameters:
"   - model: string (e.g. "codellama", "llama2") See https://github.com/jmorganca/ollama/blob/main/docs/api.md#model-names .
"   - opener: (OPTIONAL) string  (e.g. "tabnew", "split", "vsplit")
"     - "tabnew": open a new tab
"     - "split", "new": open a new split
"     - "vsplit", "vnew": open a new vertical split
"     - "edit": open a new buffer in the current window
"     default: "tabnew"
" Usage:
"  :call ollama#start_chat('codellama', 'tabnew')
function ollama#start_chat(...)
  call denops#notify("ollama", "start_chat", a:000)
endfunction

" Start chat with Ollama within context.
" Parameters:
"   - model: string (e.g. "codellama", "llama2") See https://github.com/jmorganca/ollama/blob/main/docs/api.md#model-names .
"   - context: an object with the following properties
"     - headMessage: A first message to send to the model.
"     - selection: boolean (default: false) If true, the selection will be sent to the model.
"     - currentBuffer: boolean (default: false) If true, contents of the current buffer will be sent to the model.
"     - buffers: array of bufinfo (default: []) If non-empty, contents of the buffers will be sent to the model.
"                bufinfo is a bufnr (number) or an object with the following properties.
"                - bufnr: number as a buffer number
"                - name: string as a buffer name
"     - lastMessage: A last message to send to the model.
"   - opener: (OPTIONAL) string  (e.g. "tabnew", "split", "vsplit")
"     - "tabnew": open a new tab
"     - "split", "new": open a new split
"     - "vsplit", "vnew": open a new vertical split
"     - "edit": open a new buffer in the current window
"     default: "tabnew"
" Usage:
"  :call ollama#start_chat_with_context('codellama', {
"      \ "selection": v:true,
"      \ "buffers:" [1, {"bufnr": 2, "name": "foo"}],
"      \ }, 'tabnew')
"  :call ollama#start_chat_with_context('codellama', {
"      \ "selection": v:true,
"      \ "buffers:" getbufinfo({"buflisted":v:true}),
"      \ })
function ollama#start_chat_with_context(...)
  call denops#notify("ollama", "start_chat_with_context", a:000)
endfunction

" Show list models in local.
" Usage:
"  :call ollama#list_models()
function ollama#list_models()
  call denops#notify("ollama", "list_models", [])
endfunction

" Pull a model from the library.
" Parameters:
"   - name: string model name (e.g. "codellama", "llama2") See https://github.com/jmorganca/ollama/blob/main/docs/api.md#model-names
"   - insecure: (OPTIONAL) boolean (default: false) If true, allow insecure connections to the library.
" Usage:
"   :call ollama#pull_model('codellama')
function ollama#pull_model(...)
  call denops#notify("ollama", "pull_model", a:000)
endfunction

" Delete a model in local.
" Parameters:
"   - name: string model name (e.g. "codellama", "llama2") See https://github.com/jmorganca/ollama/blob/main/docs/api.md#model-names
" Usage:
"   :call ollama#delete_model('codellama')
function ollama#delete_model(...)
  call denops#notify("ollama", "delete_model", a:000)
endfunction

" Cancell all background jobs.
" Usage:
"   :call ollama#cancel()
function ollama#cancel()
  call denops#notify("ollama", "cancel", [])
endfunction
