import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  shortcut?: string;
}

const DropdownMenuItem = ({ children, onPress, disabled, shortcut }: DropdownMenuItemProps) => (
  <TouchableOpacity
    className={`flex-row items-center justify-between px-4 py-3 ${
      disabled ? 'opacity-50' : 'active:bg-gray-100'
    }`}
    onPress={onPress}
    disabled={disabled}
  >
    <Text className={`text-base ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
      {children}
    </Text>
    {shortcut && (
      <Text className="text-sm text-gray-500 ml-2">
        {shortcut}
      </Text>
    )}
  </TouchableOpacity>
);

const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <View className="px-4 py-2 border-b border-gray-200">
    <Text className="text-sm font-semibold text-gray-700">
      {children}
    </Text>
  </View>
);

const DropdownMenuSeparator = () => (
  <View className="h-px bg-gray-200 my-1" />
);

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => (
  <View className="py-1">
    {children}
  </View>
);

interface SubMenuProps {
  trigger: string;
  children: React.ReactNode;
}

const DropdownMenuSub = ({ trigger, children }: SubMenuProps) => {
  const [showSubmenu, setShowSubmenu] = useState(false);

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between px-4 py-3 active:bg-gray-100"
        onPress={() => setShowSubmenu(!showSubmenu)}
      >
        <Text className="text-base text-gray-900">{trigger}</Text>
        <Text className="text-gray-500 ml-2">›</Text>
      </TouchableOpacity>
      {showSubmenu && (
        <View className="ml-4 border-l border-gray-200 pl-2">
          {children}
        </View>
      )}
    </>
  );
};

const Button = ({ 
  children, 
  onPress, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  onPress: () => void;
  variant?: 'default' | 'outline';
}) => (
  <TouchableOpacity
    className={`px-4 py-2 rounded-md ${
      variant === 'outline' 
        ? 'border border-gray-300 bg-white' 
        : 'bg-blue-500'
    }`}
    onPress={onPress}
  >
    <Text className={`text-center font-medium ${
      variant === 'outline' ? 'text-gray-900' : 'text-white'
    }`}>
      {children}
    </Text>
  </TouchableOpacity>
);

export function DropdownMenuDemo() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <View className="flex-row items-center p-4 border-b border-gray-100">
      <Button variant="outline" onPress={() => setIsOpen(true)}>
        Open
      </Button>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={closeMenu}
        >
          <Pressable 
            className="bg-white rounded-lg shadow-lg w-56 max-h-96"
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView className="max-h-96">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  shortcut="⇧⌘P"
                  onPress={() => {
                    console.log('Profile pressed');
                    closeMenu();
                  }}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  shortcut="⌘B"
                  onPress={() => {
                    console.log('Billing pressed');
                    closeMenu();
                  }}
                >
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem 
                  shortcut="⌘S"
                  onPress={() => {
                    console.log('Settings pressed');
                    closeMenu();
                  }}
                >
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  shortcut="⌘K"
                  onPress={() => {
                    console.log('Keyboard shortcuts pressed');
                    closeMenu();
                  }}
                >
                  Keyboard shortcuts
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onPress={() => {
                  console.log('Team pressed');
                  closeMenu();
                }}>
                  Team
                </DropdownMenuItem>
                
                <DropdownMenuSub trigger="Invite users">
                  <DropdownMenuItem onPress={() => {
                    console.log('Email pressed');
                    closeMenu();
                  }}>
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onPress={() => {
                    console.log('Message pressed');
                    closeMenu();
                  }}>
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onPress={() => {
                    console.log('More pressed');
                    closeMenu();
                  }}>
                    More...
                  </DropdownMenuItem>
                </DropdownMenuSub>

                <DropdownMenuItem 
                  shortcut="⌘+T"
                  onPress={() => {
                    console.log('New Team pressed');
                    closeMenu();
                  }}
                >
                  New Team
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onPress={() => {
                console.log('GitHub pressed');
                closeMenu();
              }}>
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onPress={() => {
                console.log('Support pressed');
                closeMenu();
              }}>
                Support
              </DropdownMenuItem>
              <DropdownMenuItem disabled>API</DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                shortcut="⇧⌘Q"
                onPress={() => {
                  console.log('Log out pressed');
                  closeMenu();
                }}
              >
                Log out
              </DropdownMenuItem>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}