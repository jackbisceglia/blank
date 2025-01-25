import { useNavigate } from '@solidjs/router';
import { Component, onMount } from 'solid-js';

interface RedirectProps {
  url: string;
}

const Redirect: Component<RedirectProps> = (props) => {
  const nav = useNavigate();

  onMount(() => {
    nav(props.url);
  });

  return <></>;
};

export default Redirect;
