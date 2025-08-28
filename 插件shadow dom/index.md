# 如何在浏览器插件中使用 Shadow DOM 样式隔离

## 环境要求

本文以 **React + Vite** 浏览器插件项目为例，展示如何实现 **Shadow DOM** 样式隔离。

**技术栈要求：**

- **React** 项目
- **Vite** 作为构建工具
- 使用 **Vite** 打包浏览器插件

**其他框架适用性：**

- **Vue + Vite**、**Svelte + Vite** 等其他框架配合 **Vite** 使用类似思路
- **Webpack** 项目可以使用相应的 **loader** 实现 **CSS inline** 导入

## Shadow DOM 的使用场景

我们在开发**浏览器插件**的时候，浏览器插件分为 4 个部分的 **UI**：

- **Popup**：点击浏览器 icon 弹出的页面
- **Side Panel**：侧边弹出框
- **New Tab**：新标签页
- **Content Script**：内容脚本

前三个（**popup**、**side panel**、**new tab**）都是独立页面，所以不会有样式问题。但是第四个 **content script** 的内容是镶嵌到宿主网页的，在写 **Content script** 的时候，你的样式可能会被主网站的样式所影响。

这个时候我们就需要一个**隔离样式**的方式。

## 样式隔离的两种方式

隔离样式分为两种：

1. **IFrame 方式**：用 **IFrame** 去请求一个第三方的网页，这种是最简单的
2. **Shadow DOM 方式**：**Shadow DOM** 可以很好地隔离主网站和你插件 **Content Script** 的样式

### Shadow DOM 基本创建示例

```typescript
// Content Script 中创建 Shadow DOM
import { createRoot } from "react-dom/client";

// 创建 Shadow DOM 容器
const hostDiv = document.createElement("div");
hostDiv.id = "__listenup-extension-host";
hostDiv.style.position = "relative";
hostDiv.style.zIndex = "9";

// 创建 Shadow Root (使用 open 模式以便调试)
const shadowRoot = hostDiv.attachShadow({ mode: "open" });

// 创建 React 根容器
const reactContainer = document.createElement("div");
reactContainer.id = "__root";
reactContainer.style.fontSize = "16px";

// 将 React 容器添加到 Shadow DOM
shadowRoot.appendChild(reactContainer);

// 将 Shadow DOM host 添加到页面
document.body.appendChild(hostDiv);

// 创建 React 根
const root = createRoot(reactContainer);
```

## Tailwind CSS 与 REM 单位的问题

我们知道了 **Shadow DOM** 可以隔离样式，但还有一个问题：我们现在的 **CSS** 基础使用的是 **Tailwind CSS** 这个框架来做样式输出。

这样就会遇到一个问题——我们都知道 **Tailwind** 使用 **REM** 这个相对于根元素 **font-size** 的单位来做 **spacing** 和 **font-size** 的处理。

**Shadow DOM** 并不会隔离 **REM** 这个相对于根元素 **font-size** 单位换算的特性。如果主网站的根元素的 **font-size** 不是 **16px**，你的插件样式就会受到影响。

### REM 与 PX 的换算关系

**基础换算公式：**

```
1rem = 根元素的 font-size (通常是 16px)
```

**Tailwind 单位换算示例：**

```
p-4 = padding: 1rem = 16px
p-2 = padding: 0.5rem = 8px
text-base = font-size: 1rem = 16px
text-lg = font-size: 1.125rem = 18px
```

### 解决方案：REM 转 EM

我们需要把 **REM** 换成 **EM**，在 **Shadow DOM** 的根上设置一个 **font-size** 为 **16px**，这样 **EM** 单位就会基于 **Shadow DOM** 内部的字体大小进行计算，而不会受到主网站根元素的影响。

## 两种实现方式

### 方式一：PostCSS 插件转换（构建时）

通常以前 **Tailwind** 是基于 **PostCSS** 来做 **CSS** 语法的换算，但是现在 **Tailwind V4** 已经从 **PostCSS** 独立出来使用 **Lightning CSS** 了。

我们当然也可以切换到 **PostCSS** 上面，因为 **Tailwind** 依旧支持这种方式，因为有很多以前的 **PostCSS** 插件需要使用。

比如在 **tailwind v3** 版本，你就可以使用 **postcss** 插件的方式，直接搜索插件就好了。

### 方式二：Vite + 运行时转换（推荐）

现在我们可以使用 **Vite** 的一个特性，结合**运行时转换**来解决这个问题：

#### 完整实现代码

```typescript
// 在 Content Script 中导入依赖
import { createRoot } from "react-dom/client";
import { HeroUIProvider } from "@heroui/react";
import styleText from "./style.css?inline";
import Subtitles from "./components/subtitles";

// 创建 Shadow DOM 容器
const hostDiv = document.createElement("div");
hostDiv.id = "__listenup-extension-host";
hostDiv.style.position = "relative";
hostDiv.style.zIndex = "9";

// 创建 Shadow Root
const shadowRoot = hostDiv.attachShadow({ mode: "open" });

// 创建 React 根容器并设置基础字体大小
const reactContainer = document.createElement("div");
reactContainer.id = "__root";
reactContainer.style.fontSize = "16px"; // 关键：设置基础字体大小，确保 EM 单位正确换算

// 注入样式到 Shadow DOM
const injectStyles = () => {
  // 将 CSS 中的 rem 单位转换为 em 单位
  const convertedCSS = styleText.replaceAll("rem", "em");

  // 创建 style 元素并注入转换后的 CSS
  const tailwindStyle = document.createElement("style");
  tailwindStyle.textContent = convertedCSS;
  shadowRoot.appendChild(tailwindStyle);
};

// 注入样式
injectStyles();

// 将 React 容器添加到 Shadow DOM
shadowRoot.appendChild(reactContainer);

// 将 Shadow DOM host 添加到页面
document.body.appendChild(hostDiv);

// 创建 React 根并渲染组件
const root = createRoot(reactContainer);
root.render(
  <HeroUIProvider>
    <Subtitles />
  </HeroUIProvider>
);
```

这个实现将 **Shadow DOM** 创建、样式注入和 **React** 应用渲染整合在一起，形成了完整的工作流程。**Vite** 的 **`?inline`** 后缀会将 **CSS** 文件作为字符串导入，而不是注入到页面的 **`<head>`** 中。

**为什么这样有效？**

- **REM** 相对于 HTML 根元素（`:root`）的 font-size
- **EM** 相对于当前元素或父元素的 font-size
- 通过将 **`reactContainer.style.fontSize = "16px"`**，我们确保了 **EM** 单位始终以 **16px** 为基准计算
- 即使主网站修改了根元素字体大小，我们的插件样式仍然保持一致

**HTML 根元素与 Shadow DOM 根元素的区别：**

```css
/* HTML 根元素选择器 - 影响整个页面 */
:root {
  --main-color: blue;
  font-size: 16px;
}

/* Shadow DOM 根元素选择器 - 只影响 Shadow DOM 内部 */
:host {
  --main-color: blue;
  font-size: 16px;
}
```

## CSS 变量的处理

现在我们解决了 **font-size** 换算的问题，但我们还有一个问题：有一些 **CSS 变量**是设置在 **HTML** 根元素（**`:root`**）上面的。

我们就需要设置在 **Shadow DOM** 的根元素（**`:host`**）上面，确保这些变量在 **Shadow DOM** 内部可用。

### CSS 样式文件中使用 :host

在 **Shadow DOM** 的 **CSS** 文件中，我们直接使用 **`:host`** 来定义 **CSS 变量**：

```css
/* style.css */
@import "tailwindcss";

:host {
  /* Tailwind CSS 变量定义 */
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-translate-z: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-scale-z: 1;
  --tw-rotate-x: initial;
  --tw-rotate-y: initial;
  --tw-rotate-z: initial;
  --tw-skew-x: initial;
  --tw-skew-y: initial;
  --tw-border-style: solid;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-color: initial;
  --tw-ring-color: initial;
  --tw-ring-shadow: 0 0 #0000;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  /* ... 其他 Tailwind 变量 */
  --tw-content: "";
  --tw-outline-style: solid;
}
```

这样所有的 **CSS 变量**都会被正确地应用到 **Shadow DOM** 的根元素上，而不会受到主网站样式的影响。

## 辅助功能和交互性问题

现在还差最后一个问题：在 **Shadow DOM** 环境中，**无障碍阅读功能**的支持存在一些限制。

### 什么是无障碍阅读

**无障碍阅读** 是指为视力障碍用户提供的**屏幕阅读器**支持，通过语音朗读网页内容帮助他们使用网页。常见的屏幕阅读器包括 **NVDA**、**JAWS** 等。

### React ARIA 在 Shadow DOM 中的问题

**React ARIA** 是提供**无障碍访问功能**的 **React** 库，它会根据 **ARIA 属性**来判断元素的交互状态和行为。但在 **Shadow DOM** 中可能失效，主要原因：

1. **ARIA 属性检测失效**：**React ARIA** 内部的逻辑无法正确识别 **Shadow DOM** 中的 **ARIA 属性**
2. **交互状态判断错误**：基于 **ARIA** 的交互逻辑（如是否可点击、是否禁用）可能失效
3. **事件处理异常**：依赖 **ARIA** 状态的事件处理可能不会正确触发

这可能会导致你的 **hover**、**click**、**press** 或者 **active** 这种依赖于 **React ARIA** 的交互状态不会很好地触发。

### 解决建议

如果你使用的 **UI 库**支持 **Shadow DOM** 的**无障碍访问**，那就没问题。如果不支持，可能需要手动实现一些交互功能。

对于大多数**浏览器插件**来说，这个问题影响有限，因为插件功能相对简单，**无障碍访问**需求较少。但如果你的 **UI 交互性**不够流畅，可能需要注意这个问题。

## 完整的 Shadow DOM 样式隔离实现

基于以上所有技术点，这里是一个完整的 **Shadow DOM** 样式隔离实现示例：

```typescript
// content/index.tsx
import { createRoot } from "react-dom/client";
import { HeroUIProvider } from "@heroui/react";
import styleText from "./style.css?inline";
import MyComponent from "./components/MyComponent";

// 创建 Shadow DOM 容器
const hostDiv = document.createElement("div");
hostDiv.id = "__my-extension-host";
hostDiv.style.position = "relative";
hostDiv.style.zIndex = "9999";

// 创建 Shadow Root
const shadowRoot = hostDiv.attachShadow({ mode: "open" });

// 创建 React 根容器
const reactContainer = document.createElement("div");
reactContainer.id = "__root";
reactContainer.style.fontSize = "16px"; // 确保 em 单位正确换算

// 注入 Tailwind CSS 到 Shadow DOM
const injectStyles = () => {
  // 转换 CSS 以适配 Shadow DOM
  const convertedCSS = styleText.replaceAll("rem", "em");

  // 创建并注入样式
  const tailwindStyle = document.createElement("style");
  tailwindStyle.textContent = convertedCSS;
  shadowRoot.appendChild(tailwindStyle);
};

// 注入样式
injectStyles();

// 将 React 容器添加到 Shadow DOM
shadowRoot.appendChild(reactContainer);

// 将 Shadow DOM host 添加到页面
document.body.appendChild(hostDiv);

// 创建 React 根并渲染
const root = createRoot(reactContainer);
root.render(
  <HeroUIProvider>
    <MyComponent />
  </HeroUIProvider>
);
```
