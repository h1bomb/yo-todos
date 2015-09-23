# todos

这个项目主要用于yo的使用和教学。

将会建立多个分支阐述创建一个todo list的过程。

第四步：


### 编写模板

拆解页面结构：

```
layout
  \_header
  \_todo
    \_header
    \_section
    \_footer
    \_bottom
  \_footer

```

其中，header，todo/header,todo/section,todo/footer,todo/bottom,footer都是partials
采用handlebars模板编写。
当前后端返回数据时，在前端进行数据绑定生成HTML。
![没有样式的视图](http://7wy47w.com1.z0.glb.clouddn.com/78F31156-3915-4DBB-847C-FFF611125C2C.png)