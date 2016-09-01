#mahalo-loader
This module contains a loader for webpack. It is used to load scripts and
templates for Mahalo applications.

## Installation
You should install this package as a development dependency like so:

```sh
npm install --save-dev mahalo-loader
```

##Usage
Configure webpack to use the loader for the desired file types. Typically you will
use the **.ts** extension for your script files and the **.mhml** extension for your
templates. This will provide the best IDE support. However **.js** files will
be handled as well via the **allowJs** compiler option.

In your webpack config object you should have something similar to this:

```javascript
    module: {
        loaders: [
            {
                test: /\.(ts|mhml)$/,
                loader: 'mahalo?extension=html', // extension default is 'mhml'
                query: {
                    extension: 'html' // Alternative way to define extension format
                }
            }
        ]
    },

    // Alternative way to define extension format
    mahaloLoader: {
        extension: 'html'
    }
```