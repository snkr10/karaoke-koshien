# カラオケ甲子園 Socket.io イベント設計

## 前提

- ホストのみが実行できる操作（ラウンド開始、得点入力、最終発表など）は `hostToken` を伴わせてサーバー側で検証する
- `hostToken` はルーム作成時に発行し、ホスト端末の `localStorage` に保存する（リロード・再接続時もホスト権限を維持するため）
- 参加者側は `roomCode` + `participantId` を `localStorage` に保存し、再接続時に自分が誰かを復元する

## イベント一覧

### 1. セッション作成

**emit（ホスト → サーバー）**：`session:host_create`
```json
{ "hostName": "しゅん" }
```

**response（サーバー → ホスト）**：`session:created`
```json
{ "sessionId": "uuid", "roomCode": "AB12CD", "hostToken": "xxxx" }
```

### 2. 参加者の参加・退出

**emit（参加者 → サーバー）**：`participant:join`
```json
{ "roomCode": "AB12CD", "name": "れな" }
```

**response（サーバー → 参加者本人）**：`participant:joined`
```json
{ "participantId": "uuid", "sessionId": "uuid" }
```
同名が既にいる場合はサーバー側で自動的に "れな(2)" のように連番を付与する。

**emit（ホスト → サーバー）**：`participant:remove`
```json
{ "hostToken": "xxxx", "participantId": "uuid" }
```

**broadcast（サーバー → ルーム全員）**：`session:state`（参加・退出のたびに配信）
```json
{
  "participants": [
    { "participantId": "uuid", "name": "しゅん", "active": true }
  ]
}
```

### 3. ラウンド開始

**emit（ホスト → サーバー）**：`round:start`
```json
{ "hostToken": "xxxx", "mode": "team" }
```
モードは `individual` / `team`。`team` の場合、サーバー側で直前ラウンドと重複しないペアを自動生成する。

**broadcast（サーバー → ルーム全員）**：`round:started`
```json
{
  "roundId": "uuid",
  "roundNumber": 3,
  "mode": "team",
  "performances": [
    {
      "performanceId": "uuid",
      "memberIds": ["uuid1", "uuid2"],
      "suggestedSong": { "title": "曲名", "artist": "アーティスト" }
    },
    {
      "performanceId": "uuid",
      "memberIds": ["uuid3"],
      "suggestedSong": { "title": "曲名", "artist": "アーティスト" }
    }
  ]
}
```

**emit（ホスト → サーバー、ペア組み直したい場合）**：`round:reshuffle_pairs`
```json
{ "hostToken": "xxxx", "roundId": "uuid" }
```
→ `round:started` を同じ roundId で再配信（performances が更新される）

### 4. 得点入力

**emit（ホスト → サーバー）**：`score:submit`
```json
{ "hostToken": "xxxx", "performanceId": "uuid", "rawScore": 92.4 }
```

**broadcast（サーバー → ルーム全員）**：`score:updated`
```json
{ "performanceId": "uuid", "rawScore": 92.4 }
```

そのラウンドの全performanceの得点が揃ったタイミングで、サーバー側が自動的に順位ポイント（1位2pt／2位1pt）を計算し、以下を配信する。

**broadcast（サーバー → ルーム全員）**：`ranking:updated`
```json
{
  "totalScoreRanking": [
    { "participantId": "uuid", "totalScore": 271.2 }
  ],
  "rankPointsRanking": [
    { "participantId": "uuid", "rankPoints": 4 }
  ]
}
```

**emit（ホスト → サーバー、入力ミス修正）**：`score:correct`
```json
{ "hostToken": "xxxx", "performanceId": "uuid", "rawScore": 89.8 }
```
次のラウンドが開始するまでは修正可能。修正後は `score:updated` と `ranking:updated` を再配信する。

### 5. 最終発表

**emit（ホスト → サーバー）**：`session:finalize`
```json
{ "hostToken": "xxxx", "decisionMetric": "rank_points" }
```
`decisionMetric` は `total_score` / `rank_points`。

**broadcast（サーバー → ルーム全員、同時演出のトリガー）**：`session:final_result`
```json
{
  "metric": "rank_points",
  "winnerParticipantId": "uuid",
  "ranking": [
    { "participantId": "uuid", "name": "しゅん", "value": 8 }
  ]
}
```
このイベントの受信をきっかけに、全端末で同時にドラムロール→カウントダウン→優勝者発表の演出を開始する。

### 6. 再接続時の状態復元

**emit（クライアント → サーバー）**：`session:sync_request`
```json
{ "roomCode": "AB12CD", "participantId": "uuid" }
```

**response（サーバー → 本人）**：`session:state_full`
```json
{
  "session": { "status": "in_progress" },
  "participants": [ "..." ],
  "currentRound": { "..." },
  "totalScoreRanking": [ "..." ],
  "rankPointsRanking": [ "..." ]
}
```
Socket.io切断→再接続を検知したら自動的にこのイベントを送るようクライアント側に実装する。

### 7. エラー通知

**emit（サーバー → 対象クライアント）**：`error`
```json
{ "code": "ROOM_NOT_FOUND", "message": "ルームが見つかりません" }
```
主なcode: `ROOM_NOT_FOUND` / `INVALID_HOST_TOKEN` / `NOT_ENOUGH_PARTICIPANTS` / `DUPLICATE_NAME_LOCKED`
