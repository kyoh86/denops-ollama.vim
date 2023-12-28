function ollama#generate_completion() abort
  let l:prompt = input("Prompt:")
    call denops#notify("ollama", "generate_completion", ["codellama", l:prompt, {}])
endfunction
