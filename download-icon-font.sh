#!/bin/bash
folder=src/icon-font
filename=icon-font.zip
rm -rf $folder
curl -o $filename 'https://fonts.google.com/download?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Sharp|Material+Icons+Round|Material+Icons+Two+Tone'
7z x $filename -o$folder
mv $filename $folder
