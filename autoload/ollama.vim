" Start chat with Ollama
" Parameters:
"   - model: string (e.g. "codellama", "llama2") See https://github.com/jmorganca/ollama/blob/main/docs/api.md#model-names .
"   - opener: (OPTIONAL) string  (e.g. "tabnew", "split", "vsplit")
"     - "tabnew": open a new tab
"     - "split", "new": open a new split
"     - "vsplit", "vnew": open a new vertical split
"     - "edit": open a new buffer in the current window
"     default: "tabnew"
" Usage:
"  :call ollama#start_chat('tabnew', 'codellama')
function ollama#start_chat(...)
  call denops#notify("ollama", "start_chat", a:000)
endfunction
