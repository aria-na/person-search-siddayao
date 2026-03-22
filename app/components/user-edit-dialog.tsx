'use client'

import { updateUser } from '@/app/actions/actions'
import { userFormSchema, User, UserFormData } from '@/app/actions/schemas'
import { useAuth, useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { UserForm } from './user-form'
import MutableDialog, { ActionState } from '@/components/mutable-dialog'

interface UserEditDialogProps {
  user: User
}

export function UserEditDialog({ user }: UserEditDialogProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  const promptSignIn = () => {
    toast({
      title: "Sign in required",
      description: "Please sign in or sign up to edit users.",
      variant: "destructive",
    })
    void openSignIn()
  }

  const handleEditUser = async (data: UserFormData): Promise<ActionState<User>> => {
    try {
      const updatedUser = await updateUser(user.id, data)
      return {
        success: true,
        message: `User ${updatedUser.name} updated successfully`,
        data: updatedUser,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user' + (error instanceof Error ? error.message : String(error)),
      }
    }
  }

  if (isLoaded && !isSignedIn) {
    return <Button onClick={promptSignIn}>Edit</Button>
  }

  return (
    <MutableDialog<UserFormData>
      formSchema={userFormSchema}
      FormComponent={UserForm}
      action={handleEditUser}
      triggerButtonLabel="Edit"
      editDialogTitle={`Edit ${user.name}`}
      dialogDescription={`Update the details of ${user.name} below.`}
      submitButtonLabel="Save Changes"
      defaultValues={{
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      }}
    />
  )
}
