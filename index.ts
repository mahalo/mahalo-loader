import {extname, join} from 'path';
import {getLoaderConfig} from 'loader-utils';
import mahaloTransformer from 'mahalo-transformer';
import mahaloTranspiler from 'mahalo-transpiler';

export default function mahaloLoader(text) {
    let callback = this.async() || this.callback;
    let resourcePath = this.resourcePath;
    let config = getLoaderConfig(this, 'mahaloLoader');
    let extension = extname(this.resourcePath);
    let result;
    
    this.cacheable();

    try {
        if (/\.ts/i.test(extension)) {
            result = mahaloTranspiler(resourcePath);
        } else {
            result = mahaloTransformer(resourcePath, config.extension, this.minimize || false);
        }
    } catch(error) {
        callback(error);
        return;
    }

    result.map.sourceRoot = this.context;
    result.map.sourcesContent = [text];

    callback(null, result.text, JSON.stringify(result.map));
}
module.exports = exports.default;