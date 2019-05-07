# pipe-designer

## Features

可视化Pipe插件，能够自动检测代码中的pipe部分并绘制成对应的流程图，也可通过流程图对原有的代码做修改。

目前支持的pipe特性如下：

> 在下列支持特性中，类型标注为 text 的则代表只支持纯文本，不支持表达式或其他任何变量的形式，这是由于目前还无法在一些别名路径的情况下做类型推断。

- [x] pipe(source: text)
- [x] pipe.key(key: text)
- [x] pipe.destination(dist: text)
- [x] pipe.worker() 部分支持，现在只能检测是否启用，而不能检测具体的worker
- [x] pipe.lazy(lazy: boolean)

<!-- ## Known Issues
-- -->

## Release Notes

### 0.1.0
Basic Support.
