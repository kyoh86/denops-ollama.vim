function ollama#generate_completion#start(...)
  let l:opts = get(a:000, 0,  {})
  let l:editor = get(l:opts, "editor", "new")
  let l:bufname = "ollama://generate_completion"
  let l:bufnr = bufadd(l:bufname)
  call setbufvar(l:bufnr, "&filetype", "ollama.generate_completion")
  call setbufvar(l:bufnr, "&buftype", "prompt")
  call setbufvar(l:bufnr, "&buflisted", v:true)
  call setbufvar(l:bufnr, "&swapfile", v:false)
  call setbufvar(l:bufnr, "&backup", v:false)
  call setbufvar(l:bufnr, "&wrap", v:true)
  call bufload(l:bufnr)
  call execute(l:editor .. " " .. l:bufname)
  call setbufline(l:bufnr, 1, ["Enter the name of the completion to generate: "])
  call prompt_setprompt(l:bufnr, ">> ")
  call prompt_setcallback(l:bufnr, function("ollama#generate_completion#callback", [l:bufnr]))
endfunction

function ollama#generate_completion#callback(bufnr, text)
  if (a:text ==# "exit")
    call execute("bdelete! " .. a:bufnr)
    return
  endif
  call denops#notify("ollama", "generate_completion", [a:bufnr, "codellama", a:text, {}])
endfunction
