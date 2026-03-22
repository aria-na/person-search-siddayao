'use client'

import * as React from "react"
import { SearchCommand } from "@/components/search-command"
import { searchUsers } from '@/app/actions/actions'
import { User } from "../actions/schemas"
import { useAuth, useClerk } from '@clerk/nextjs'
import { toast } from '@/hooks/use-toast'



export default function SearchInput() {
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  const promptSignIn = React.useCallback(() => {
    toast({
      title: "Sign in required",
      description: "Please sign in or sign up to search users.",
      variant: "destructive",
    })
    void openSignIn()
  }, [openSignIn])

  const handleSearch = React.useCallback(async (value: string) => {
    if (!isLoaded || !isSignedIn) {
      return []
    }

    return searchUsers(value)
  }, [isLoaded, isSignedIn])

  const handleSelect = React.useCallback((user: User) => {
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('userId', user.id)
    window.history.pushState({}, '', url.toString())
    window.location.reload()
  }, [])

  return (
    <div className="w-full max-w-md mx-auto relative">
      <SearchCommand<User>
        onSearch={handleSearch}
        onItemSelect={handleSelect}
        getItemId={(user) => user.id}
        getItemLabel={(user) => user.name}
        placeholder="Search users..."
        noResultsText="No users found."
      />
      {isLoaded && !isSignedIn ? (
        <button
          type="button"
          onClick={promptSignIn}
          className="absolute inset-0 z-20"
          aria-label="Sign in to search users"
          title="Sign in to search users"
        />
      ) : null}
    </div>
  )
}

