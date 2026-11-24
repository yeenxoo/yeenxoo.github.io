---
pubDatetime: 2026-11-24T22:00:00+08:00
title: 用 bitset 做高維偏序
featured: false
draft: false
tags:
  - 偏序
  - bitset
description: 維度一高，CDQ 分治就越寫越痛苦；把每一維「比我小的點」存成 bitset 再取交集，k 維偏序只要 O(kn²/w)。
---

三維偏序可以用 CDQ 分治，但到了四維、五維，每多一維就要多套一層，又難寫又容易錯。這時候 bitset 是一個暴力但好寫的做法：時間 $O(kn^2/w)$，跟維度幾乎無關。

## 問題

給 $n$ 個 $k$ 維的點 $a_1, \dots, a_n$，對每個點 $i$，求有幾個 $j \ne i$ 滿足

$$
a_{j,d} \le a_{i,d} \quad \text{對所有維度 } d = 1, \dots, k
$$

也就是每一維都不比 $a_i$ 大的點有幾個。這種關係叫做 $a_i$ **支配** $a_j$。

二維的情況就是數「左下方」有幾個點：

![左：被 P 支配的點落在 P 的左下方；右：兩維的 bitset 取 AND 後，數 1 的個數](/posts/bitset-partial-order/dominance.svg)

## 低維的做法

| 維度 | 做法           | 複雜度              |
| ---- | -------------- | ------------------- |
| 1    | 排序           | $O(n \log n)$       |
| 2    | 排序 + BIT     | $O(n \log n)$       |
| 3    | CDQ 分治 + BIT | $O(n \log^2 n)$     |
| $k$  | CDQ 套 CDQ……   | $O(n \log^{k-1} n)$ |

維度越高，CDQ 要一層一層套上去，常數和程式碼長度都會爆炸。

## bitset 的想法

把條件拆成每一維各自的集合。令

$$
S_d(i) = \{\, j \mid a_{j,d} \le a_{i,d} \,\}
$$

是第 $d$ 維不比 $a_i$ 大的點。那答案就是所有維度的**交集**：

$$
\text{ans}_i = \left| \bigcap_{d=1}^{k} S_d(i) \right| - 1
$$

減 1 是因為 $i$ 自己一定在交集裡。

把每個 $S_d(i)$ 存成長度 $n$ 的 bitset，交集就是 AND，大小就是 `count()`。bitset 一次處理 $w = 64$ 個位元，所以一次 AND 是 $O(n / w)$。

上圖的例子：$P$ 在 $x$ 方向的集合是 $\{1, 2, 3, 4, P\}$，$y$ 方向是 $\{2, 4, P, 6\}$，AND 後剩 $\{2, 4, P\}$，扣掉自己得到 2。

## 怎麼算出每個 $S_d(i)$

如果每一維對每個點都存一個 bitset，要 $k \cdot n^2$ 個位元，太多了。其實不用全部存下來：

- 每個點只維護一個 `ans[i]`，一開始全是 1。
- 對每一維，把點按該維座標排序，從小到大掃過去，用一個 `cur` 記錄「目前掃過的點」。
- 掃到點 $i$ 時，`cur` 剛好就是 $S_d(i)$，直接 `ans[i] &= cur`。

> [!WARNING]
> 座標**相同**的點要先全部加進 `cur`，再一起更新 `ans`。不然排在前面的點會漏算跟它同值、但排在後面的點。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 30000;
int n, k;
int a[MAXN][5];
bitset<MAXN> ans[MAXN], cur;

int main() {
    cin >> n >> k;
    for (int i = 0; i < n; i++)
        for (int d = 0; d < k; d++) cin >> a[i][d];

    for (int i = 0; i < n; i++) ans[i].set();

    vector<int> ord(n);
    for (int d = 0; d < k; d++) {
        iota(ord.begin(), ord.end(), 0);
        sort(ord.begin(), ord.end(),
             [&](int x, int y) { return a[x][d] < a[y][d]; });
        cur.reset();
        for (int l = 0, r = 0; l < n; l = r) {
            // 同一個值的點要先全部加進去，才會算到「等於」的情況
            while (r < n && a[ord[r]][d] == a[ord[l]][d]) cur.set(ord[r++]);
            for (int t = l; t < r; t++) ans[ord[t]] &= cur;
        }
    }

    for (int i = 0; i < n; i++)
        cout << ans[i].count() - 1 << '\n';  // 扣掉自己
}
```

時間 $O(k \cdot n \log n + k n^2 / w)$。$n = 3 \times 10^4$、$k = 5$ 時大約 $7 \times 10^7$ 次 64 位元運算，實測 0.16 秒。

## 記憶體不夠：分塊

`ans` 是 $n \times n$ 個位元，$n = 3 \times 10^4$ 時約 112 MB；$n = 10^5$ 時要 1.25 GB，開不下。

解法是**分塊**：一次只處理 $B$ 個點的答案。

- 每一維的排序只做一次。
- 對每一塊，每一維都從頭掃一遍，`cur` 照樣維護全部 $n$ 個點，但只更新這 $B$ 個點的 `res`。
- 記憶體從 $n^2$ 位元降到 $B \cdot n$ 位元。

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100000, B = 2048;
int n, k;
int a[MAXN][5];
bitset<MAXN> res[B], cur;

int main() {
    cin >> n >> k;
    for (int i = 0; i < n; i++)
        for (int d = 0; d < k; d++) cin >> a[i][d];

    // 每一維的排序只做一次
    vector<vector<int>> ord(k, vector<int>(n));
    for (int d = 0; d < k; d++) {
        iota(ord[d].begin(), ord[d].end(), 0);
        sort(ord[d].begin(), ord[d].end(),
             [&](int x, int y) { return a[x][d] < a[y][d]; });
    }

    vector<int> cnt(n);
    for (int L = 0; L < n; L += B) {
        int R = min(n, L + B);  // 這一塊只處理編號 [L, R) 的點
        for (int i = L; i < R; i++) res[i - L].set();
        for (int d = 0; d < k; d++) {
            const auto& o = ord[d];
            cur.reset();
            for (int l = 0, r = 0; l < n; l = r) {
                while (r < n && a[o[r]][d] == a[o[l]][d]) cur.set(o[r++]);
                for (int t = l; t < r; t++)
                    if (L <= o[t] && o[t] < R) res[o[t] - L] &= cur;
            }
        }
        for (int i = L; i < R; i++) cnt[i] = res[i - L].count() - 1;
    }

    for (int i = 0; i < n; i++) cout << cnt[i] << '\n';
}
```

時間變成 $O(k n^2 / w + k n^2 / B)$，多出來的是每一塊都要重新掃 $n$ 個點。$B = 2048$、$n = 10^5$、$k = 5$ 時，記憶體約 25 MB（實測 33 MB），時間 1.3 秒。

## 什麼時候用

- **適合**：$n$ 在 $10^4 \sim 10^5$、維度 $\ge 4$，或你不想寫 CDQ 的時候。
- **不適合**：$n$ 到 $10^6$ 等級，$n^2 / w$ 會太大；或是需要支援修改、線上查詢。
- **嚴格偏序**（$<$）：掃描時改成「先更新同值的點，再把它們加進 `cur`」，這樣 `cur` 裡不會有自己，最後也不用減 1。

## 練習題

### 三維偏序

- [洛谷 P3810 - 【模板】三維偏序（陌上花開）](https://www.luogu.com.cn/problem/P3810)

  > [!TIP]- 提示
  >
  > 正解是 CDQ 分治，但用上面的分塊 bitset 也能做：算出每個點的支配數後再統計。

### 變形：雙邊條件

- [NTUCPC OJ 1512 - 五維西洋棋](https://oj.ntucpc.org/problems/1512)（2026 YTP 高中組決賽）

  > [!TIP]- 提示
  >
  > 條件變成每一維 $|a_{j,d} - a_{i,d}| \le k$，所以每一維的集合從「前綴」變成排序後的一段「區間」。掃描時用滑動視窗維護 `cur`：右邊把 $\le a_{i,d} + k$ 的點加進來，左邊把 $< a_{i,d} - k$ 的點移掉。每個點的交集大小減 1 後加總，再除以 2 就是點對數。記憶體限制夠大，不用分塊。
