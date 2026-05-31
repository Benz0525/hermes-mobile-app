// 单一真源：所有 UI 版本号从此引用
// 升版只需改 package.json → Metro 自动同步
import pkg from '../../package.json';
export const APP_VERSION = pkg.version;
