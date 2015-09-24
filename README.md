# todos

这个项目主要用于yo的使用和教学。

将会建立多个分支阐述创建一个todo list的过程。

### 构建项目
到此为止，已经把todos的功能已全部实现但是，工作流程，才走了一半，后面将会执行构建，将现有的项目，部署到测试环境，当测试环境测试没有问题，讲发布到生产。

而做这些事情，可以由gulp来完成，gulp可以编写管道式的构建过程，高效的将需要的自动化过程执行。
目前前端的gulp涉及如下的任务：

* 运行server
* compass的实时预处理
* js的合并和库文件的合并
* 样式的合并
* 部署到CDN

代码清单详见：client/gulpfile.js。

#### 测试代码打包
```
cd client
gulp

```
测试环境运行
```
cd ..
NODE_ENV=test node server/app
```
#### 生产环境发布和运行

把代码部署到CDN
```
cd client
gulp dist
```
运行生产环境,需要保证服务不会挂掉，所以需要使用MP2来进行进程守护，以及服务监控和治理。
```
cd ..
NODE_ENV=production pm2 start server/app
```