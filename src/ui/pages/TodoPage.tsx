import React, { useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Checkbox, IconButton, List, ListItem, ListItemIcon, ListItemText, Stack, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

interface TodoItem {
  id: string
  title: string
  done: boolean
}

export function TodoPage() {
  const [items, setItems] = useState<TodoItem[]>([])
  const [text, setText] = useState('')

  const handleAddButtonClick = () => {
    if (!text.trim()) return
    setItems(prev => [{ id: crypto.randomUUID(), title: text.trim(), done: false }, ...prev])
    setText('')
  }

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)
  const handleToggleButtonClick = (id: string) => setItems(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it))
  const handleDeleteButtonClick = (id: string) => setItems(prev => prev.filter(it => it.id !== id))

  const progressText = useMemo(() => {
    const total = items.length
    const done = items.filter(i => i.done).length
    if (total === 0) return '아직 할 일이 없습니다.'
    return `${done}/${total} 완료`
  }, [items])

  return (
    <Stack spacing={2}>
      <Typography variant="h5">할 일</Typography>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField fullWidth size="small" placeholder="할 일을 입력하세요" value={text} onChange={handleTextInputChange} />
            <Button onClick={handleAddButtonClick}>추가</Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{progressText}</Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <List>
            {items.map(item => (
              <ListItem key={item.id} secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteButtonClick(item.id)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemIcon>
                  <Checkbox edge="start" checked={item.done} onChange={() => handleToggleButtonClick(item.id)} />
                </ListItemIcon>
                <ListItemText primary={item.title} secondary={item.done ? '완료' : undefined} />
              </ListItem>
            ))}
            {items.length === 0 && (
              <Typography variant="body2" color="text.disabled" sx={{ px: 2, py: 3 }}>할 일을 추가해보세요</Typography>
            )}
          </List>
        </CardContent>
      </Card>
    </Stack>
  )
}


