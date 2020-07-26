#!/bin/bash
rm -rf fonts
curl -o fonts.zip 'https://fonts.google.com/download?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Sharp|Material+Icons+Round|Material+Icons+Two+Tone'
7z x fonts.zip -ofonts
mv fonts.zip fonts
