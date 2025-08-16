# Flutter iOS 真机上同时安装不同环境的同一应用

## 问题背景

在 **Flutter iOS** 开发中，我们经常会遇到以下场景：

- 只有一个 **iPhone** 设备用于真机调试
- 数据库使用本地 **SQLite** 文件存储
- 不同环境（开发/生产）的 **Bundle ID** 是相同的

在这种情况下，从 **App Store** 下载的正式版 App 和**开发环境**安装的 App 会相互覆盖，并且共用同一个 **SQLite** 文件，导致**数据混合**。

大部分时间我们使用**模拟器**调试，不会遇到这个问题。但当需要**真机调试**时，我们必须将两个环境**隔离**开来，避免数据混乱。

更重要的是，我们有时需要删除应用来测试初始化功能，如果数据混合就无法准确测试。

为了解决这个问题，我们需要为**开发环境**和**生产环境**设置不同的 **Bundle ID**，这样就可以在同一台手机上看到多个**不同环境**的相同 App。

![示例](showcase1.png)

这里我只展示两个，一个是**真实发布**的 **Bundle ID**，一个对应的是**开发环境**的 **Bundle ID**。

## 准备环境

在开始配置之前，请确保你已经准备好以下环境：

- **MacBook**
- **VSCode** 用来开发 Flutter
- **Xcode** 用来打包
- **iOS Simulator** 用来调试

## 配置步骤

下面我们开始设置 **Xcode**，配置不同环境对应不同的 **Bundle ID**。

### 1. 打开 Xcode 项目

首先打开我们的 **Flutter** 工程的 **iOS** 文件，使用 **Xcode** 打开。

我们可以看到最上面的正中间有一个 **Runner**。

![xcode1](xcode1.png)

这个在 **Xcode** 里面称为 **Scheme**。不同的 **Scheme** 会对应一个不同的打包逻辑，我们在 **Flutter build iOS** 的时候就可以通过指定 **Scheme** 的名字来实现不同的打包流程。

那我们如果不指定 **Scheme** 的话，它默认的就是第一个 **Runner**。

### 2. 配置 Build Configuration

接着左边点一下 **Runner** 这个 Menu，然后点击里面 **Project** 下面的 **Runner**，继续点击 **Info**。

![xcode2](xcode2.png)

在 **Configuration** 模块我们可以看到 **Debug/Release/Profile** 分别对应不同环境下打包的一些参数。

![xcode3](xcode3.png)

我们在开发的时候就是默认 **Debug**，我们在发布的话默认就是 **Release**。

目前这里的 **Debug**、**Release** 和 **Profile** 它们配置的 **Bundle ID** 都是一个，所以你在开发环境使用调试，如果你发布到 **App Store** 里面再下载下来，就会**覆盖**你开发环境安装的应用，反之同理。

接着我们在 **Configuration** 模块，点击**加号**，选择 **Duplicate Debug**、**Release**。

![xcode4](xcode4.png)

然后我们再给它们分别改名，改叫 **Debug_dev**、**Release_dev**。

### 3. 设置 APP DISPLAY NAME

接着我们往左边看，看到 **Project** 下面有一个 **Targets**，Targets 我们依旧点击 **Runner**。

![xcode5](xcode5.png)

点击 **Runner** 之后我们可以看到上面的 **Tab** 有很多东西，接着我们点击 **Build Settings**。

接着点击**加号**，然后添加一个环境变量 **APP_DISPLAY_NAME**，根据不同 **Build Configuration**，设置不一样的名字。

![xcode7](xcode7.png)

![xcode8](xcode8.png)

**注意**这里只是注册了一个**变量**，并不会真正改变打包后的应用名字，我们还需要在 **info.plist** 里面进行修改。

现在我们在 **Xcode** 里面打开 **Info.plist**，然后找到 **Bundle display name**，修改其 **value** 如图所示，改成刚刚添加的变量名 **$(APP_DISPLAY_NAME)**

![xcode9](xcode9.png)

### 4. 配置 Bundle Identifier

我们现在开始为不同的配置设置不同的 **Bundle ID**。点击旁边的 **Targets** → **Runner**，然后点击 **General**。

![xcode10](xcode10.png)

之后我们再去看到下面有个 **Identity**，我们看到有个 **Bundle Identifier**，然后旁边有一个**箭头**，我们点击一下。

![xcode11](xcode11.png)

点进去后，会看到有不同的 **Bundle Identifier** 配置项，我们为每个环境填入**不同的** **Bundle ID** 即可。

![xcode12](xcode12.png)

### 5. 创建新的 Scheme

**Flutter** 可以通过 **--flavor** 命令来调用不同的 **Scheme**，也就是我们最开始说过的。

我们只需要创建一个新的 **Scheme** 来对应新的 **Configuration** 就好了。

我们点击 **Manage Scheme**。

![xcode13](xcode13.png)

点击右下角的**加号**。

![xcode14](xcode14.png)

选择默认的 **Runner**，然后我们输入新的名字，比如 **dev**，然后点击 **OK** 创建。

![xcode15](xcode15.png)

然后我们退出来之后，我们再点击 **Runner**，点击 **Edit Scheme**。

![xcode16](xcode16.png)

我们先选择我们刚刚创建的 **Scheme**。

![xcode17](xcode17.png)

接着我们点击左边的 **Run**，**Build Configuration** 改成 **Debug_dev**。

![xcode18](xcode18.png)

下面的 **Archive** 也是一样的，切换成 **Release_dev**。

![xcode19](xcode19.png)

到现在为止，**Xcode** 的配置全部完毕。

## VSCode 配置不同的启动命令

为了方便在开发时切换不同的环境，我们需要在 **VSCode** 中配置不同的启动命令。

找到 **VSCode** 的 **Debug** 页面，点击这个**设置按钮**开始配置运行命令。

![vscode1](vscode1.png)

可以直接复制以下**配置**：

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flutter Dev",
      "request": "launch",
      "type": "dart",
      "args": [
        "--flavor",
        "dev",
        "-t", // if you have different main file
        "lib/main.dart"
      ]
    },
    {
      "name": "Flutter Normal",
      "request": "launch",
      "type": "dart",
      "args": [
        "-t", // if you have different main file
        "lib/main.dart"
      ]
    }
  ]
}
```

解释一下命令 **`--flavor dev`**，这个是用来**区分不同环境**的，**dev** 对应的是 **Scheme** 的名字，如果没有指定就是默认的 **Runner**。

## 打包命令

在**打包**的时候记住如果要区分也要指定 **`--flavor dev`**：

```bash
flutter build ios --release --flavor dev
```

## 总结

通过以上配置，我们成功实现了在同一台 **iOS** 设备上安装**不同环境**的同一应用。**主要步骤**包括：

1. 在 **Xcode** 中创建不同的 **Build Configuration**
2. 设置不同的 **Bundle ID** 和**应用显示名称**
3. 创建对应的 **Scheme**
4. 在 **VSCode** 中配置**启动命令**

通过这种方式，我们就能有效避免**开发环境**和**生产环境**的**数据混合问题**，在同一台设备上安全地进行**多环境测试**。
