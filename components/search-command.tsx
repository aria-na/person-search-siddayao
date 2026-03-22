'use client'

import * as React from "react"
import { useCallback, useState, useRef } from "react"
import { Check, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Props for the SearchCommand component
 * @template T - The type of data being searched
 */
export interface SearchCommandProps<T> {
  /** Async function that performs the search and returns an array of results */
  onSearch: (value: string) => Promise<T[]>
  /** Callback function called when an item is selected */
  onItemSelect: (item: T) => void
  /** Function to get a unique identifier from an item */
  getItemId: (item: T) => string
  /** Function to get the display label from an item */
  getItemLabel: (item: T) => string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Text to display when no results are found */
  noResultsText?: string
}

/**
 * A reusable search command component that provides an accessible, theme-aware search interface
 * with async search capabilities and keyboard navigation.
 * 
 * @template T - The type of data being searched
 * 
 * @example
 * // Basic usage with a User type
 * interface User {
 *   id: string;
 *   name: string;
 * }
 * 
 * function UserSearch() {
 *   return (
 *     <SearchCommand<User>
 *       onSearch={async (query) => {
 *         const users = await fetchUsers(query);
 *         return users;
 *       }}
 *       onItemSelect={(user) => console.log('Selected:', user)}
 *       getItemId={(user) => user.id}
 *       getItemLabel={(user) => user.name}
 *       placeholder="Search users..."
 *     />
 *   );
 * }
 * 
 * @example
 * // Usage with custom data type
 * interface Product {
 *   sku: string;
 *   title: string;
 *   description: string;
 * }
 * 
 * function ProductSearch() {
 *   return (
 *     <SearchCommand<Product>
 *       onSearch={searchProducts}
 *       onItemSelect={handleProductSelect}
 *       getItemId={(product) => product.sku}
 *       getItemLabel={(product) => product.title}
 *       placeholder="Search products..."
 *       noResultsText="No products found"
 *     />
 *   );
 * }
 * 
 * @features
 * - 🎨 Theme aware (works with light/dark mode)
 * - ⌨️ Keyboard navigation support
 * - 🔍 Async search with loading states
 * - 📱 Responsive design
 * - ♿ Accessible (follows WAI-ARIA practices)
 * - 🔄 Maintains input focus while searching
 * 
 * @accessibility
 * - Maintains focus on input while typing
 * - Proper ARIA labels and roles
 * - Keyboard navigation support
 * - Screen reader friendly
 */
export const SearchCommand = <T,>({
  onSearch,
  onItemSelect,
  getItemId,
  getItemLabel,
  placeholder = "Search...",
  noResultsText = "No results found.",
}: SearchCommandProps<T>) => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const handleSearch = useCallback(async (value: string) => {
    setSearchQuery(value)
    
    if (!value) {
      setItems([])
      setOpen(false)
      return
    }

    setLoading(true)
    setOpen(true)
    focusInput()
    
    try {
      const results = await onSearch(value)
      setItems(results)
    } catch (error) {
      console.error('Error searching:', error)
      setItems([])
    } finally {
      setLoading(false)
      focusInput()
    }
  }, [focusInput, onSearch])

  const handleSelect = useCallback((item: T) => {
    setSelectedItem(item)
    setOpen(false)
    setSearchQuery(getItemLabel(item))
    onItemSelect(item)
  }, [getItemLabel, onItemSelect])

  return (
    <div className="w-full relative">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) {
            focusInput()
          }
        }}
      >
        <PopoverTrigger asChild>
          <div>
            <Command 
              className="rounded-lg border shadow-md"
              shouldFilter={false}
            >
              <CommandInput 
                ref={inputRef}
                placeholder={placeholder}
                value={searchQuery}
                onValueChange={handleSearch}
                onFocus={() => {
                  if (searchQuery) {
                    setOpen(true)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
              />
            </Command>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {(searchQuery.length > 0 || loading) && (
            <Command shouldFilter={false}>
              <CommandList>
                <CommandGroup>
                  {loading ? (
                    <CommandItem disabled className="flex items-center gap-2 py-6 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </CommandItem>
                  ) : items.length === 0 ? (
                    <CommandItem disabled>{noResultsText}</CommandItem>
                  ) : (
                    items.map((item) => (
                      <CommandItem
                        key={getItemId(item)}
                        value={getItemId(item)}
                        onSelect={() => handleSelect(item)}
                        onMouseMove={() => inputRef.current?.focus()}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedItem && getItemId(selectedItem) === getItemId(item) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {getItemLabel(item)}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

