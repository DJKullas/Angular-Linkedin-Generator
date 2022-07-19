To add a new theme, copy the html into a new component, delete all the headers from the html, add the css files to src/assets/css, import the css files in 
src/styles.scss, add js files to assets/js, use the function in app.component.ts to load the js files, the order matters for dependencies

I moved loadscript into the creative component, idk if I should copy it everywhere or load a ton in the appcomonet, somehting to think about