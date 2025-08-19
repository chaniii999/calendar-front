import React from 'react'
import { Stack, Typography, IconButton, Tooltip } from '@mui/material'

export interface ColorPalettePickerProps {
	label?: string
	value?: string
	onChange?: (color: string) => void
}

const RAINBOW_COLORS: string[] = ['#EF4444', '#F59E0B', '#FBBF24', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
const MODERN_COLORS: string[] = ['#F87171', '#FDBA74', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#14B8A6']

export function ColorPalettePicker({ label = '색상 선택', value, onChange }: ColorPalettePickerProps) {
	function handleColorButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
		const color = e.currentTarget.getAttribute('data-color')
		if (color && onChange) onChange(color)
	}

	function renderRow(colors: string[]) {
		return (
			<Stack direction="row" spacing={1}>
				{colors.map((c) => (
					<Tooltip key={c} title={c} arrow>
						<IconButton
							data-color={c}
							onClick={handleColorButtonClick}
							size="small"
							sx={{
								width: 24,
								height: 24,
								borderRadius: '50%',
								p: 0,
								bgcolor: c,
								border: value === c ? '2px solid rgba(0,0,0,0.6)' : '2px solid rgba(0,0,0,0.1)',
								'&:hover': { opacity: 0.9 },
							}}
						/>
					</Tooltip>
				))}
			</Stack>
		)
	}

	return (
		<Stack spacing={1}>
			<Typography variant="caption" color="text.secondary">{label}</Typography>
			{renderRow(RAINBOW_COLORS)}
			{renderRow(MODERN_COLORS)}
		</Stack>
	)
}


