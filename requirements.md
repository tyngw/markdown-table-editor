# Requirements Document

## Introduction

VSCode拡張機能として、Markdownファイル内のテーブルをプレビュー表示時に直接編集できる機能を提供します。この機能により、ユーザーはSpreadsheetライクなUIでテーブルの値を編集し、列や行の追加・削除、ソート、ドラッグ&ドロップによる並び替えを行うことができます。編集内容は元のMarkdownファイルに自動的に反映されます。

## Requirements

### Requirement 1

**User Story:** VSCodeユーザーとして、Markdownファイル内のテーブルをプレビューで表示した際に、テーブルの内容を直接編集できるようにしたい。これにより、Markdownの構文を意識せずに効率的にテーブルを編集できる。

#### Acceptance Criteria

1. WHEN ユーザーがMarkdownファイルをプレビュー表示する THEN システムは テーブル要素を編集可能な形式で表示する SHALL
2. WHEN ユーザーがテーブルのセルをクリックする THEN システムは そのセルを編集モードに切り替える SHALL
3. WHEN ユーザーがセルの値を変更して確定する THEN システムは 元のMarkdownファイルの対応する箇所を更新する SHALL
4. WHEN ユーザーがセル編集中にEscキーを押す THEN システムは 編集をキャンセルして元の値に戻す SHALL

### Requirement 2

**User Story:** VSCodeユーザーとして、テーブルに新しい行や列を追加できるようにしたい。これにより、テーブルの構造を動的に拡張できる。

#### Acceptance Criteria

1. WHEN ユーザーが行ヘッダーの追加ボタンをクリックする THEN システムは 新しい行をテーブルに追加する SHALL
2. WHEN ユーザーが列ヘッダーの追加ボタンをクリックする THEN システムは 新しい列をテーブルに追加する SHALL
3. WHEN ユーザーが行を削除する THEN システムは 対応する行をテーブルから削除し、Markdownファイルを更新する SHALL
4. WHEN ユーザーが列を削除する THEN システムは 対応する列をテーブルから削除し、Markdownファイルを更新する SHALL

### Requirement 3

**User Story:** VSCodeユーザーとして、テーブルの列をクリックしてソートできるようにしたい。これにより、データを整理して表示できる。

#### Acceptance Criteria

1. WHEN ユーザーが列ヘッダーをクリックする THEN システムは その列で昇順ソートを実行する SHALL
2. WHEN ユーザーが同じ列ヘッダーを再度クリックする THEN システムは その列で降順ソートを実行する SHALL
3. WHEN ソートが実行される THEN システムは ソート結果をMarkdownファイルに反映する SHALL
4. WHEN ソート中の列がある THEN システムは ソート方向を視覚的に表示する SHALL

### Requirement 4

**User Story:** VSCodeユーザーとして、行や列をドラッグ&ドロップで並び替えできるようにしたい。これにより、テーブルの構造を直感的に調整できる。

#### Acceptance Criteria

1. WHEN ユーザーが行ヘッダーをドラッグする THEN システムは その行を他の位置に移動できるようにする SHALL
2. WHEN ユーザーが列ヘッダーをドラッグする THEN システムは その列を他の位置に移動できるようにする SHALL
3. WHEN ドラッグ中である THEN システムは ドロップ可能な位置を視覚的に示す SHALL
4. WHEN ドラッグ&ドロップが完了する THEN システムは 新しい順序をMarkdownファイルに反映する SHALL

### Requirement 5

**User Story:** VSCodeユーザーとして、編集可能なテーブルがSpreadsheetライクなUIを持つようにしたい。これにより、馴染みのあるインターフェースでテーブルを操作できる。

#### Acceptance Criteria

1. WHEN テーブルが表示される THEN システムは グリッド線、行番号、列ヘッダーを表示する SHALL
2. WHEN ユーザーがキーボードの矢印キーを使用する THEN システムは セル間の移動を可能にする SHALL
3. WHEN ユーザーがTabキーを押す THEN システムは 次のセルに移動する SHALL
4. WHEN ユーザーがEnterキーを押す THEN システムは 下のセルに移動する SHALL

### Requirement 6

**User Story:** VSCodeユーザーとして、テーブル編集機能がVSCodeの標準的な拡張機能として動作するようにしたい。これにより、既存のワークフローに自然に統合できる。

#### Acceptance Criteria

1. WHEN 拡張機能がインストールされる THEN システムは VSCodeのMarkdownプレビューに統合される SHALL
2. WHEN Markdownファイルが変更される THEN システムは プレビューを自動的に更新する SHALL
3. WHEN 複数のMarkdownファイルが開かれている THEN システムは それぞれのファイルのテーブルを独立して管理する SHALL
4. WHEN VSCodeが再起動される THEN システムは 拡張機能を正常に再読み込みする SHALL

### Requirement 7

**User Story:** VSCodeユーザーとして、Markdownファイルのエディタで右クリックした際に、テーブル編集機能にアクセスできるようにしたい。これにより、コンテキストメニューから簡単に機能を起動できる。

#### Acceptance Criteria

1. WHEN ユーザーがMarkdownファイルのエディタ上で右クリックする THEN システムは コンテキストメニューにテーブル編集オプションを表示する SHALL
2. WHEN ユーザーがコンテキストメニューからテーブル編集を選択する THEN システムは テーブル編集ビューを開く SHALL
3. WHEN カーソルがテーブル内にある THEN システムは そのテーブルを編集対象として選択する SHALL
4. WHEN カーソルがテーブル外にある THEN システムは 新しいテーブルの作成オプションを提供する SHALL