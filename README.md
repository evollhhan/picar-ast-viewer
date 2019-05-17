# pipe-designer

## Features

可视化Pipe插件，能够自动检测代码中的pipe部分并绘制成对应的流程图，也可通过流程图对原有的代码做修改。

### JSDoc

如果你为对应装饰方法的jsDoc里添加@as关键字，那么在图表展示的时候会有颜色提示：
```
@as service    服务模块 蓝色
@as data       数据模块 绿色
@as controller 控制模块 橙色
@as ui         视图模块 紫色
```

后续会添加一些自定义色块的展示。

如果你为方法添加@description关键字，那么你可以在图表中看到对应方法的说明。

## Known Issues
- 目前逆向修改不会格式化。
- 还有一些在代码的todo列表中等待修改。

## Release Notes

### 0.1.0
Basic Support.