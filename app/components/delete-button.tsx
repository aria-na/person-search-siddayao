'use client'

import { Button } from "@/components/ui/button"
import { Trash } from 'lucide-react'
import { deleteUser } from '@/app/actions/actions'
import { toast } from "@/hooks/use-toast"
import { useAuth, useClerk } from '@clerk/nextjs'

export default function DeleteButton({ userId }: { userId: string }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  const handleDelete = async () => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in or sign up to delete users.",
        variant: "destructive",
      })
      void openSignIn()
      return
    }

    try {
      console.log('DeleteButton: Attempting to delete user with ID', userId)
      await deleteUser(userId)
      toast({
        title: "User Deleted",
        description: `A user with the ID ${userId} has been deleted.`,
        variant: "default",
      })
    } catch (error) {
      console.error('DeleteButton: Error deleting user', error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the user.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button onClick={handleDelete} variant="destructive" >
      <Trash className="w-4 h-4 mr-2" />
      Delete
    </Button>
  )
}
