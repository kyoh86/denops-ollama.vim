# BETA

(THIS IS STILL IN BETA. PLEASE NOTE THAT WE MAY MAKE SOME DESTRUCTIVE CHANGES TO THE INTERFACE)

# denops-ollama.vim

This is the project for Vim/Neovim to chat with Ollama.
The project is designed to provide a simple and efficient way for users to interact with Ollama in Vim/Neovim,
and to make it easy for developers to extend and customize the plugin's functionality.

## doc

[./doc/ollama.txt](./doc/ollama.txt)

## usage

If you want to use it, run ollama with a model you like in local.

```console
$ ollama pull codellama
$ ollama serve
```

And call `ollama#start_chat` with the model name

# License

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg)](http://www.opensource.org/licenses/MIT)

This software is released under the
[MIT License](http://www.opensource.org/licenses/MIT), see LICENSE.
