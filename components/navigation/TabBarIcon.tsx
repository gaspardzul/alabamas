// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Ionicons>, 'name'> & { name: string };

export function TabBarIcon({ style, name, ...rest }: Props) {
  return <Ionicons size={23} name={name as ComponentProps<typeof Ionicons>['name']} style={style} {...rest} />;
}
