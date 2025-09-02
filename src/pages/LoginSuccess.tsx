import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTokens } from '@lib/api/http'
import { getTokensFromSession, saveTokensToMemory } from '@lib/auth/session'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoginSuccess() {
  const navigate = useNavigate()
  
  useEffect(() => {
    async function handleLoginSuccess() {
      if (import.meta.env.DEV) {
        console.log('🔐 OAuth2 로그인 성공 페이지 로드:', {
          url: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
        })
      }

      const search = new URLSearchParams(window.location.search)
      const userName = search.get('u')

      if (import.meta.env.DEV) {
        console.log('🔐 사용자명 확인:', { userName })
      }

      // 세션에서 토큰 조회 시도
      try {
        if (import.meta.env.DEV) {
          console.log('🔄 세션에서 토큰 조회 시작...')
        }

        const tokens = await getTokensFromSession()
        
        if (import.meta.env.DEV) {
          console.log('✅ 세션에서 토큰 조회 성공:', {
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
            userId: tokens.userId,
            userEmail: tokens.userEmail,
            userNickname: tokens.userNickname
          })
        }

        // 메모리에 토큰 저장
        setTokens(tokens.accessToken, tokens.refreshToken)
        saveTokensToMemory(tokens)
        
        if (import.meta.env.DEV) {
          console.log('✅ 로그인 성공:', tokens.userNickname || userName)
          console.log('🔄 캘린더 페이지로 이동 중...')
        }
        
        // 전역 인증 상태 업데이트 (App.tsx의 isAuthed 상태와 동기화)
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { isAuthed: true, tokens } 
        }))
        
        // 메인 페이지로 이동 (replace: true로 브라우저 히스토리에서 제거)
        navigate('/calendar', { replace: true })
        return // 함수 종료
        
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ 세션에서 토큰 조회 실패:', error)
          console.log('🔄 기존 토큰 기반 방식으로 fallback 시도...')
        }
        
        // 세션 기반 토큰 조회 실패 시 기존 방식으로 fallback
        // 백엔드에서 URL 파라미터로 토큰을 전달하는 경우를 대비
        try {
          // 잠시 대기 후 다시 시도 (백엔드 처리 시간 고려)
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const retryTokens = await getTokensFromSession()
          if (retryTokens.accessToken && retryTokens.refreshToken) {
            if (import.meta.env.DEV) {
              console.log('✅ 재시도 성공, 세션에서 토큰 조회됨')
            }
            
            setTokens(retryTokens.accessToken, retryTokens.refreshToken)
            saveTokensToMemory(retryTokens)
            
            // 전역 인증 상태 업데이트
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
              detail: { isAuthed: true, tokens: retryTokens } 
            }))
            
            navigate('/calendar', { replace: true })
            return
          }
        } catch (retryError) {
          if (import.meta.env.DEV) {
            console.error('❌ 재시도도 실패:', retryError)
          }
        }
        
        // 모든 시도 실패 시 에러 페이지로 이동
        if (import.meta.env.DEV) {
          console.error('❌ 모든 인증 방식 실패, 에러 페이지로 이동')
        }
        // 에러 페이지가 없으므로 홈으로 이동
        navigate('/', { replace: true })
      }
    }

    handleLoginSuccess()
  }, [navigate])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">로그인 처리 중...</Typography>
    </Box>
  )
}


