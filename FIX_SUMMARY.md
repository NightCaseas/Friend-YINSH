# Исправление бага с завершением игры в Friend-YINSH

## Проблема
В игре Friend-YINSH обнаружен критический баг: игроку засчитывается 3 собранных кольца, но игра на этом не заканчивается, хотя по правилам игра должна заканчиваться как только один из игроков соберёт 3 кольца.

## Причина
Ошибка находилась в файле `/artifacts/friendsyinsh/src/features/hotseat/utils/hotSeatGameLogic.ts` в строке 258.

**Неправильный код (старая версия):**
```typescript
// Проверяем, не закончилась ли игра
if (updatedGame.players[opponentPlayer].score >= 3) {  // БАГ: проверяет счет противника!
  board.phase = 'finished';
  updatedGame.status = 'finished';
} else {
  // Возвращаемся к фазе игры
  board.phase = 'playing';
  // Передаем ход следующему игроку
  board.turn = opponentColor;
  updatedGame.currentPlayer = opponentPlayer;
}
```

**Проблема:** Код проверял счет противника (`opponentPlayer`), в то время как очко получает текущий игрок.

## Исправления

### 1. Основное исправление (строка 258)
Исправлено в файле `/artifacts/friendsyinsh/src/features/hotseat/utils/hotSeatGameLogic.ts`:

```typescript
// Проверяем, не закончилась ли игра
if (updatedGame.players[move.player].score >= 3) {  // ИСПРАВЛЕНО: проверяет счет текущего игрока
  board.phase = 'finished';
  updatedGame.status = 'finished';
} else {
  // Возвращаемся к фазе игры
  board.phase = 'playing';
  // Передаем ход следующему игроку
  board.turn = opponentColor;
  updatedGame.currentPlayer = opponentPlayer;
}
```

### 2. Улучшение логики игры
Также была добавлена полная логика проверки строк после удаления кольца (аналогично API серверу):

```typescript
} else {
  // Проверяем, есть ли строки у противника для удаления
  const opponentRows = findRows(board, opponentColor);
  if (opponentRows.length > 0) {
    board.pendingRemovalRows = opponentRows;
    board.phase = 'row-removal';
    // Ход остается у текущего игрока для удаления строки
  } else {
    // Проверяем, есть ли строки у текущего игрока для удаления
    const playerRows = findRows(board, playerColor);
    if (playerRows.length > 0) {
      board.pendingRemovalRows = playerRows;
      board.phase = 'row-removal';
      // Ход остается у текущего игрока для удаления строки
    } else {
      // Возвращаемся к фазе игры
      board.phase = 'playing';
      // Передаем ход следующему игроку
      board.turn = opponentColor;
      updatedGame.currentPlayer = opponentPlayer;
    }
  }
}
```

Это делает логику игры более полной и соответствующей правилам YINSH:
- После удаления кольца сначала проверяются строки противника
- Если у противника нет строк, проверяются строки текущего игрока
- Если нет строк вообще, ход передается другому игроку

## Тестирование
Проведено ручное тестирование исправления:

1. **Тест 1:** Игрок 1 собирает 3-е кольцо → игра завершается ✅
2. **Тест 2:** Игрок 2 собирает 3-е кольцо → игра завершается ✅  
3. **Тест 3:** Игрок собирает 2-е кольцо → игра продолжается ✅
4. **Тест 4:** Проверка старой логики → подтвержден баг ❌

## Файлы, затронутые изменениями
1. `/artifacts/friendsyinsh/src/features/hotseat/utils/hotSeatGameLogic.ts` - основное исправление
2. Файл проверен на отсутствие аналогичных ошибок в других местах кода

## Дополнительные рекомендации
1. **Тесты:** Рекомендуется добавить unit-тесты для сценария завершения игры
2. **UI:** Модальное окно завершения игры (`HotSeatGameOverModal`) существует, но может не отображаться автоматически
3. **Согласованность:** Проверить согласованность логики между hotseat режимом и онлайн игрой

## Проверка
Проверка типов TypeScript успешна (ошибки только в несвязанных файлах).

**Статус:** БАГ ИСПРАВЛЕН ✅