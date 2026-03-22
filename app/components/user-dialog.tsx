// app/components/user-dialog.tsx
'use client'

import {  addUser } from '@/app/actions/actions'
import { userFormSchema, User, UserFormData } from '@/app/actions/schemas'
import { useAuth, useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

import { UserForm } from './user-form'
import MutableDialog, { ActionState }  from '@/components/mutable-dialog'


export function UserDialog() {
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  const promptSignIn = () => {
    toast({
      title: "Sign in required",
      description: "Please sign in or sign up to add users.",
      variant: "destructive",
    })
    void openSignIn()
  }

  const handleAddUser = async (data: UserFormData): Promise<ActionState<User>> => {
    try {
      const newUser = await addUser(data)
      return {
        success: true,
        message: `User ${newUser.name} added successfully`,
        data: newUser
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add user ' + (error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  if (isLoaded && !isSignedIn) {
    return (
      <Button onClick={promptSignIn}>
        Add User
      </Button>
    )
  }

  return (
    <MutableDialog<UserFormData>
      formSchema={userFormSchema}
      FormComponent={UserForm}
      action={handleAddUser}
      triggerButtonLabel="Add User"
      addDialogTitle="Add New User"
      dialogDescription="Fill out the form below to add a new user."
      submitButtonLabel="Save"
      defaultValues={{ name: '', email: '', phoneNumber: '' }} // Default empty values
    />
  )
}