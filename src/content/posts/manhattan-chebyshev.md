---
pubDatetime: 2026-11-24T20:00:00+08:00
title: 曼哈頓距離與切比雪夫距離的轉換
featured: false
draft: false
tags:
  - 曼哈頓距離
  - 切比雪夫距離
  - 座標轉換
description: 把座標轉 45 度，曼哈頓距離就變成切比雪夫距離，反之亦然；以及它在競程裡的幾個經典用法。
---

把平面座標「轉 45 度」，曼哈頓距離和切比雪夫距離就可以互相轉換。這個技巧常常能把一個難算的距離，變成另一個好算的距離。

## 兩種距離

對平面上兩點 $A(x_1, y_1)$、$B(x_2, y_2)$，令 $\Delta x = x_1 - x_2$、$\Delta y = y_1 - y_2$。

- **曼哈頓距離**（Manhattan）：走格子、只能上下左右

  $$
  d_M(A, B) = |\Delta x| + |\Delta y|
  $$

- **切比雪夫距離**（Chebyshev）：西洋棋的國王，八個方向都能走一步

  $$
  d_C(A, B) = \max(|\Delta x|, |\Delta y|)
  $$

以中間的點為起點，到周圍每一格的距離：

![曼哈頓距離與切比雪夫距離：從中心到周圍各格的距離](/posts/manhattan-chebyshev/distances.svg)

曼哈頓距離是兩個絕對值**相加**，很好拆成 $x$、$y$ 兩維分別處理，但很難求最大值；切比雪夫距離是**取 max**，求最大值很方便，但不好拆維度。轉換的價值就在這裡：哪種好算就換成哪種。

## 轉換公式

### 曼哈頓 → 切比雪夫

令

$$
(x, y) \mapsto (u, v) = (x + y,\; x - y)
$$

則**原座標的曼哈頓距離 = 新座標的切比雪夫距離**：

$$
|\Delta x| + |\Delta y| = \max(|\Delta u|, |\Delta v|)
$$

### 切比雪夫 → 曼哈頓

反過來，令

$$
(x, y) \mapsto (u, v) = \left(\frac{x + y}{2},\; \frac{x - y}{2}\right)
$$

則**原座標的切比雪夫距離 = 新座標的曼哈頓距離**。

> [!TIP]
> 為了避免分數，實作時通常還是用 $(x + y,\ x - y)$，算出曼哈頓距離後再**整體除以 2**。

## 為什麼成立

關鍵是這個恆等式：對任意實數 $a, b$，

$$
|a| + |b| = \max(|a + b|,\ |a - b|)
$$

證明：

- 若 $a, b$ 同號，$|a + b| = |a| + |b|$，而 $|a - b| \le |a| + |b|$，所以 max 取到 $|a| + |b|$。
- 若 $a, b$ 異號，$|a - b| = |a| + |b|$，而 $|a + b| \le |a| + |b|$，同理成立。

把 $a = \Delta x$、$b = \Delta y$ 代入，右邊的 $a + b = \Delta u$、$a - b = \Delta v$，就是上面的轉換公式。

### 幾何直觀

到原點距離 $\le 1$ 的點集合：

- 曼哈頓距離是一個**菱形**（頂點在 $(\pm 1, 0)$、$(0, \pm 1)$）
- 切比雪夫距離是一個**正方形**（頂點在 $(\pm 1, \pm 1)$）

菱形轉 45 度再放大 $\sqrt{2}$ 倍就是正方形，$(x, y) \mapsto (x + y, x - y)$ 做的正是「旋轉 45 度 + 放大 $\sqrt{2}$ 倍（再鏡射）」。

![左：曼哈頓距離為 1、2、3 的菱形；右：轉換後變成切比雪夫距離為 1、2、3 的正方形](/posts/manhattan-chebyshev/rotate.svg)

左邊每一圈菱形 $|x| + |y| = r$，轉換後剛好變成右邊同顏色的正方形 $\max(|u|, |v|) = r$。

## 例子

$A(1, 2)$、$B(4, 0)$：

|              | 座標                  | 距離                   |
| ------------ | --------------------- | ---------------------- |
| 原座標       | $A(1, 2)$、$B(4, 0)$  | $d_M = 3 + 2 = 5$      |
| $(x+y, x-y)$ | $A(3, -1)$、$B(4, 4)$ | $d_C = \max(1, 5) = 5$ |

兩邊都是 5。

## 應用一：最遠曼哈頓點對

> 給 $n$ 個點，求兩點間曼哈頓距離的最大值。

直接枚舉是 $O(n^2)$。轉成切比雪夫後，

$$
\max_{i, j} d_M = \max\left(\max_i u_i - \min_i u_i,\ \ \max_i v_i - \min_i v_i\right)
$$

只要維護 $u$、$v$ 各自的最大最小值，$O(n)$ 解決。

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    int n;
    cin >> n;
    ll maxU = LLONG_MIN, minU = LLONG_MAX;
    ll maxV = LLONG_MIN, minV = LLONG_MAX;
    for (int i = 0; i < n; i++) {
        ll x, y;
        cin >> x >> y;
        ll u = x + y, v = x - y;
        maxU = max(maxU, u), minU = min(minU, u);
        maxV = max(maxV, v), minV = min(minV, v);
    }
    cout << max(maxU - minU, maxV - minV) << '\n';
}
```

## 應用二：所有點對的切比雪夫距離總和

> 給 $n$ 個點，求 $\sum_{i < j} d_C(P_i, P_j)$。

切比雪夫距離有 max，不能拆維度。轉成曼哈頓後就能把 $u$、$v$ 分開算：

$$
\sum_{i < j} d_C(P_i, P_j) = \frac{1}{2} \left( \sum_{i < j} |u_i - u_j| + \sum_{i < j} |v_i - v_j| \right)
$$

其中 $u = x + y$、$v = x - y$。

一維的「所有點對差的絕對值總和」：排序後，第 $i$ 個數（0-indexed）會比前面 $i$ 個數都大，貢獻是 $a_i \cdot i - (\text{前綴和})$。總共 $O(n \log n)$。

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// sum_{i<j} |a_i - a_j|
ll pairAbsSum(vector<ll> a) {
    sort(a.begin(), a.end());
    ll res = 0, prefix = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        res += a[i] * i - prefix;
        prefix += a[i];
    }
    return res;
}

int main() {
    int n;
    cin >> n;
    vector<ll> u(n), v(n);
    for (int i = 0; i < n; i++) {
        ll x, y;
        cin >> x >> y;
        u[i] = x + y;
        v[i] = x - y;
    }
    // 每一對的 |du| + |dv| 恰好是 2 倍的切比雪夫距離，所以一定整除
    cout << (pairAbsSum(u) + pairAbsSum(v)) / 2 << '\n';
}
```

## 應用三：菱形範圍變成正方形

> 問與 $(x, y)$ 曼哈頓距離 $\le d$ 的點有幾個。

原座標下這是一個菱形，不好用前綴和；轉成 $(u, v)$ 後變成邊與座標軸平行的正方形

$$
[u - d,\ u + d] \times [v - d,\ v + d]
$$

就能用二維前綴和、BIT 或掃描線處理。

更進一步，如果有很多個菱形範圍（例如「每家店服務曼哈頓距離 $R_i$ 以內的路口」），問哪個點被覆蓋的權重和最大，轉換後就是經典的「矩形覆蓋最大值」：沿 $u$ 方向掃描，用線段樹對 $v$ 做區間加值、查全域最大值。

## 注意事項

> [!WARNING]
>
> - **奇偶性**：$u = x + y$ 和 $v = x - y$ 的奇偶性一定相同。在 $(u, v)$ 座標裡找到的點，若 $u, v$ 奇偶不同，就對應不回整數格點。
> - **值域變大**：$u, v$ 的範圍是原本的兩倍，$v$ 還可能是負的。開陣列或做座標壓縮時要記得平移。
> - **溢位**：總和類的題目答案很容易超過 `int`，一律用 `long long`。

## 練習題

### 應用一：最遠曼哈頓點對

- [AtCoder ABC178 E - Dist Max](https://atcoder.jp/contests/abc178/tasks/abc178_e)

  > [!TIP]- 提示
  >
  > 直接套應用一：維護 $u$、$v$ 的最大最小值。

- [CSES 3410 - Maximum Manhattan Distances](https://cses.fi/problemset/task/3410)

  > [!TIP]- 提示
  >
  > 點一個一個加入，邊加邊維護 $u$、$v$ 的最大最小值，每次 $O(1)$ 回答。

- [AtCoder ABC437 F - Manhattan Christmas Tree 2](https://atcoder.jp/contests/abc437/tasks/abc437_f)

  > [!TIP]- 提示
  >
  > 線段樹維護區間內 $u$、$v$ 的最大最小值，支援單點修改。詢問點 $(u_q, v_q)$ 的答案是 $\max(\max u - u_q,\ u_q - \min u,\ \max v - v_q,\ v_q - \min v)$。

### 應用二：距離總和（切比雪夫 → 曼哈頓）

- [洛谷 P3964 - 松鼠聚會](https://www.luogu.com.cn/problem/P3964)（TJOI2013）

  > [!TIP]- 提示
  >
  > 聚會點必須是某隻松鼠的家，所以不能直接取中位數。對每個家算它到所有點的距離和：$u$、$v$ 各自排序後用前綴和 + 二分搜，$O(\log n)$ 算出一個家的答案，再取最小值。

- [AtCoder ABC476 F - Chebyshev Cafe](https://atcoder.jp/contests/abc476/tasks/abc476_f)

  > [!TIP]- 提示
  >
  > 把每格的權重按 $u$、$v$ 分別加總成兩個一維陣列，再用前綴和算出每個位置到所有權重的距離和，兩維相加除以 2。

### 應用三：菱形範圍變成正方形

- [NTUCPC OJ 1487 - 遺址之謎](https://oj.ntucpc.org/problems/1487)（2026 YTP 高中組初賽）

  > [!TIP]- 提示
  >
  > 距離恰好 $d$，轉換後就是落在正方形 $[u-d, u+d] \times [v-d, v+d]$ 的**邊上**。把點按 $u$、按 $v$ 分組排序，二分搜數四條邊上的點，注意角落不要重複算。

- [TIOJ 2228 - 歡樂外送點](https://tioj.ck.tp.edu.tw/problems/2228)（2020 全國賽 F）

  > [!TIP]- 提示
  >
  > 每個菱形變成正方形，問被覆蓋權重和最大的格點：沿 $u$ 方向掃描線，線段樹對 $v$ 做區間加值、查最大值。只有 $u$、$v$ 同奇偶的點是合法路口，要分兩種奇偶分別處理。

- [AtCoder ABC233 Ex - Manhattan Christmas Tree](https://atcoder.jp/contests/abc233/tasks/abc233_h)

  > [!TIP]- 提示
  >
  > 二分搜距離 $d$，檢查正方形 $[u-d, u+d] \times [v-d, v+d]$ 內的點數是否 $\ge K$。矩形計數可用可持久化線段樹或 wavelet matrix。
