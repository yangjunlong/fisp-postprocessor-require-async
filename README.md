# fisp-postprocessor-require-async

分析使用了require.async执行的组件，并把它们记录下来

> 主要修正了在fisp中模板继承的页面，静态资源加载顺序(css 和 js 的加载顺序)不正确的问题。

## 如何使用？

+ 安装
    
```
npm install -g fisp-postprocessor-require-async
```

+ 配置

```
fis.config.merge({
    modules: {
        postprocessor: {
            js: 'require-async',
            tpl: 'require-async'
        }
    }
});
```
在[fis-plus](https://github.com/fex-team/fis-plus)已默认存在该配置，无需配置
