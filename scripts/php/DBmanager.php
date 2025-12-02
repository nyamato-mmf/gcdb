<?php
try {
    // SQLiteデータベースに接続
    $db = new PDO('sqlite:admin.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // エラーモードを例外に設定
    $db->exec("PRAGMA encoding = 'UTF-8';"); // オプション：エンコーディング設定（SQLiteでは通常UTF-8がデフォルト）

} catch (PDOException $e) {
    echo 'DB接続エラー: ' . $e->getMessage();
}
?>
