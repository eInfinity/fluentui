import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactTestUtils from 'react-dom/test-utils';
import { create } from '@fluentui/utilities/lib/test';
import { mount, ReactWrapper } from 'enzyme';
import * as renderer from 'react-test-renderer';

import { KeyCodes, resetIds } from '../../Utilities';
import { Dropdown } from './Dropdown';
import { DropdownMenuItemType } from './Dropdown.types';
import { isConformant } from '../../common/isConformant';
import { safeCreate } from '@fluentui/test-utilities';
import type { ReactTestRenderer } from 'react-test-renderer';
import type { IDropdownOption, IDropdown } from './Dropdown.types';

const DEFAULT_OPTIONS: IDropdownOption[] = [
  { key: 'Header1', text: 'Header 1', itemType: DropdownMenuItemType.Header },
  { key: '1', text: '1' },
  { key: '2', text: '2', title: 'test' },
  { key: '3', text: '3' },
  { key: 'Divider1', text: '-', itemType: DropdownMenuItemType.Divider },
  { key: '4', text: '4' },
  { key: 'Header2', text: 'Header 2', itemType: DropdownMenuItemType.Header },
  { key: '5', text: '5' },
  { key: '6', text: '6' },
];

const RENDER_OPTIONS: IDropdownOption[] = [
  { key: 'Header1', text: 'Header 1', itemType: DropdownMenuItemType.Header },
  { key: '1', text: '1', selected: true },
  { key: 'Divider1', text: '-', itemType: DropdownMenuItemType.Divider },
  { key: '2', text: '2', title: 'test' },
];

describe('Dropdown', () => {
  let component: ReactTestRenderer | undefined;
  let wrapper: ReactWrapper | undefined;

  beforeEach(() => {
    resetIds();
  });

  afterEach(() => {
    if (component) {
      component.unmount();
      component = undefined;
    }
    if (wrapper) {
      wrapper.unmount();
      wrapper = undefined;
    }
    if ((setTimeout as any).mock) {
      jest.useRealTimers();
    }

    document.body.innerHTML = '';
  });

  isConformant({
    Component: Dropdown,
    displayName: 'Dropdown',
  });

  describe('single-select', () => {
    it('Renders correctly', () => {
      component = create(<Dropdown options={DEFAULT_OPTIONS} />);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('Renders correctly when open', () => {
      // Mock createPortal so that the options list ends up inside the wrapper for snapshotting
      spyOn(ReactDOM, 'createPortal').and.callFake(node => node);
      // There's intermittent variation (maybe measurement-related) on different computers,
      // so use fake timers to make it more predictable even though we never advance the timers.
      jest.useFakeTimers();

      const ref = React.createRef<IDropdown>();
      // Specify dropdownWidth to prevent inconsistent calculated widths from getting into the snapshot
      wrapper = mount(<Dropdown options={RENDER_OPTIONS} componentRef={ref} dropdownWidth={200} />);
      ref.current!.focus(true);
      wrapper.update();
      expect(wrapper.getDOMNode()).toMatchSnapshot();
    });

    it('Renders groups based on header start and divider end', () => {
      wrapper = mount(<Dropdown options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('click');
      const groups = document.querySelectorAll('[role="group"]');
      // Expect 2 groups with role=group
      expect(groups.length).toEqual(2);
      // Expect first group to have 5 elements
      expect(groups[0].childElementCount).toEqual(5);
      // Expect first item to have text Header 1
      expect(groups[0].childNodes[0].textContent).toEqual('Header 1');
      // Expect first item (the header) to have id equal to the group's aria-labelledby
      expect(groups[0].firstElementChild!.getAttribute('id')).toEqual(groups[0].getAttribute('aria-labelledby'));
      // Expect last item to be the divider
      expect(groups[0].childNodes[groups[0].childNodes.length - 1].textContent).toEqual('');
      // Expect option 4 to be a sibling of the first group
      expect(groups[0].nextSibling!.textContent).toEqual('4');
      // Expect second group to have 3 elements
      expect(groups[1].childElementCount).toEqual(3);
    });

    it('Can flip between enabled and disabled.', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);
      const dropdownRoot = wrapper.getDOMNode().querySelector('.ms-Dropdown') as HTMLElement;

      expect(dropdownRoot.className).not.toEqual(expect.stringMatching('is-disabled'));
      expect(dropdownRoot.getAttribute('data-is-focusable')).toEqual('true');

      wrapper.setProps({ disabled: true });

      expect(dropdownRoot.className).toEqual(expect.stringMatching('is-disabled'));
      expect(dropdownRoot.getAttribute('data-is-focusable')).toEqual('false');
    });

    it('Renders no selected item in default case', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('');
    });

    it('Renders a selected item if option specifies selected', () => {
      wrapper = mount(
        <Dropdown
          label="testgroup"
          options={[
            { key: '1', text: '1', selected: true },
            { key: '2', text: '2' },
          ]}
        />,
      );

      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1');
    });

    it('Renders a selected item in uncontrolled case', () => {
      wrapper = mount(<Dropdown label="testgroup" defaultSelectedKey="1" options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1');
    });

    it('does not change the selected item in when defaultSelectedKey changes', () => {
      wrapper = mount(<Dropdown label="testgroup" defaultSelectedKey="1" options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1');

      wrapper.setProps({ defaultSelectedKey: '2' });
      expect(titleElement.text()).toEqual('1');
    });

    it('Renders a selected item in controlled case', () => {
      wrapper = mount(<Dropdown label="testgroup" selectedKey="1" options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1');
    });

    it('changes the selected item in when selectedKey changes', () => {
      wrapper = mount(<Dropdown label="testgroup" selectedKey="1" options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1');

      wrapper.setProps({ selectedKey: '2' });
      expect(titleElement.text()).toEqual('2');
    });

    it('clears when the selectedKey is null', () => {
      safeCreate(<Dropdown selectedKey="1" options={DEFAULT_OPTIONS} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe('1');

        renderer.act(() => {
          container.update(<Dropdown selectedKey={null} options={DEFAULT_OPTIONS} />);
        });
        expect(dropdownOptionText.children?.[0]).toBe(undefined);
      });
    });

    it('Can change items in uncontrolled case', () => {
      wrapper = mount(<Dropdown label="testgroup" defaultSelectedKey="1" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;

      expect(secondItemElement.getAttribute('title')).toEqual('test');

      ReactTestUtils.Simulate.click(secondItemElement);
      expect(wrapper.find('.ms-Dropdown-title').text()).toEqual('2');
    });

    it('calls onChange when the selected item is different', () => {
      const onChangeSpy = jest.fn();

      wrapper = mount(
        <Dropdown id="foo" label="testgroup" defaultSelectedKey="1" onChange={onChangeSpy} options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;
      ReactTestUtils.Simulate.click(secondItemElement);

      expect(onChangeSpy).toHaveBeenCalledWith(expect.anything(), DEFAULT_OPTIONS[2], 2);
      expect(onChangeSpy.mock.calls[0][0].target.id).toEqual('foo');
    });

    it('calls onChange when the selected item is the same if notifyOnReselect is true', () => {
      const onChangeSpy = jest.fn();

      wrapper = mount(
        <Dropdown
          label="testgroup"
          defaultSelectedKey="3"
          onChange={onChangeSpy}
          options={DEFAULT_OPTIONS}
          notifyOnReselect={true}
        />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="3"]') as HTMLElement;
      ReactTestUtils.Simulate.click(secondItemElement);

      expect(onChangeSpy).toHaveBeenCalledWith(expect.anything(), DEFAULT_OPTIONS[3], 3);
    });

    it('calls onDismiss when dismissing options callout', () => {
      const onDismissSpy = jest.fn();

      wrapper = mount(
        <Dropdown label="testgroup" defaultSelectedKey="1" onDismiss={onDismissSpy} options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;
      ReactTestUtils.Simulate.click(secondItemElement);

      expect(onDismissSpy).toHaveBeenCalledTimes(1);
    });

    it('sets the selected item even when key is number 0', () => {
      const options = [
        { key: 0, text: 'item1' },
        { key: 1, text: 'item2' },
      ];

      safeCreate(<Dropdown options={options} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe(undefined);

        renderer.act(() => {
          container.update(<Dropdown selectedKey={0} options={options} />);
        });
        expect(dropdownOptionText.children?.[0]).toBe('item1');
      });
    });

    it('selectedIndices should not contains -1 even when selectedKey is not in options', () => {
      const options = [
        { key: 0, text: 'item1' },
        { key: 1, text: 'item2' },
      ];

      safeCreate(<Dropdown selectedKey={0} options={options} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe('item1');

        renderer.act(() => {
          container.update(<Dropdown selectedKey={-1} options={options} />);
        });
        expect(dropdownOptionText.children?.[0]).toBe(undefined);
      });
    });

    it('does not call onChange when the selected item is not different', () => {
      const onChangeSpy = jest.fn();
      wrapper = mount(
        <Dropdown label="testgroup" defaultSelectedKey="1" onChange={onChangeSpy} options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="1"]') as HTMLElement;
      ReactTestUtils.Simulate.click(secondItemElement);

      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('Keypresses on a disabled dropdown has no effect.', () => {
      const options = [...DEFAULT_OPTIONS];
      options[3] = { key: 3, text: '3', selected: true };
      wrapper = mount(<Dropdown label="testgroup" disabled options={options} />);
      const dropdownRoot = wrapper.find('.ms-Dropdown');

      const titleElement = dropdownRoot.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('3');
      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      expect(titleElement.text()).toEqual('3');
      dropdownRoot.simulate('keydown', { which: KeyCodes.up });
      expect(titleElement.text()).toEqual('3');
    });

    it('Keypresses on a normal dropdown selects the right, valid items.', () => {
      const options = [...DEFAULT_OPTIONS];
      options[3] = { key: 3, text: '3', selected: true };
      wrapper = mount(<Dropdown label="testgroup" options={options} />);
      const dropdownRoot = wrapper.find('.ms-Dropdown');

      const titleElement = dropdownRoot.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('3');
      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      expect(titleElement.text()).toEqual('4');
      dropdownRoot.simulate('keydown', { which: KeyCodes.up });
      expect(titleElement.text()).toEqual('3');
      dropdownRoot.simulate('keydown', { which: KeyCodes.up });
      expect(titleElement.text()).toEqual('2');
    });

    it('does not select any item on focus', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('focus');

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('');
    });

    it('can be programmatically focused when tabIndex=-1, and will not automatically select an item', () => {
      const dropdown = React.createRef<IDropdown>();

      const container = document.createElement('div');
      document.body.appendChild(container);

      // in enzyme, when we call the programmatic focus(), it does not trigger the onFocus callback of the div
      // being focused. Utilize JSDOM instead.
      ReactDOM.render(
        <Dropdown componentRef={dropdown} label="testgroup" tabIndex={-1} options={DEFAULT_OPTIONS} />,
        container,
      );

      dropdown.current!.focus(false);

      const titleElement = container.querySelector('.ms-Dropdown-title') as HTMLElement;
      // for some reason, JSDOM does not return innerText of 1 so we have to use innerHTML instead.
      expect(titleElement.innerHTML).toEqual('');
    });

    it('opens and does not automatically select an item when focus(true) is called', () => {
      const dropdown = React.createRef<IDropdown>();

      const container = document.createElement('div');
      document.body.appendChild(container);

      ReactTestUtils.act(() => {
        ReactDOM.render(<Dropdown componentRef={dropdown} label="testgroup" options={DEFAULT_OPTIONS} />, container);
      });

      expect(document.body.querySelector('.ms-Dropdown-item')).toBeNull();

      ReactTestUtils.act(() => {
        dropdown.current!.focus(true);
      });
      const titleElement = container.querySelector('.ms-Dropdown-title') as HTMLElement;
      expect(titleElement.innerHTML).toEqual('');
    });

    it('selects the first valid item on Home keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.home });

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1');
    });

    it('selects the last valid item on End keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);
      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.end });

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('6');
    });

    it('skips over headers and separators on keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);
      const dropdownRoot = wrapper.find('.ms-Dropdown');

      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1');

      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      expect(titleElement.text()).toEqual('4');
    });

    it('Shows correct tooltip only if title prop is specified', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('click');

      const firstItemElement = document.querySelector('.ms-Dropdown-item[data-index="1"]') as HTMLElement;
      expect(firstItemElement.getAttribute('title')).toBeFalsy();

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;
      expect(secondItemElement.getAttribute('title')).toEqual('test');

      const thirdItemElement = document.querySelector('.ms-Dropdown-item[data-index="3"]') as HTMLElement;
      expect(thirdItemElement.getAttribute('title')).toBeFalsy();
    });

    it('opens on focus if openOnKeyboardFocus is true', () => {
      wrapper = mount(<Dropdown openOnKeyboardFocus label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('focus');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;
      expect(secondItemElement).toBeTruthy();
    });

    it('opens on click if openOnKeyboardFocus is true', () => {
      wrapper = mount(<Dropdown openOnKeyboardFocus label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('mousedown');
      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelector('.ms-Dropdown-item[data-index="2"]') as HTMLElement;
      expect(secondItemElement).toBeTruthy();
    });

    it('closes on blur when openOnKeyboardFocus is true', () => {
      wrapper = mount(<Dropdown openOnKeyboardFocus label="testgroup" options={DEFAULT_OPTIONS} />);

      wrapper.find('.ms-Dropdown').simulate('focus');

      let dropdownElement = document.querySelector('.ms-Dropdown-items') as HTMLElement;
      expect(dropdownElement).toBeTruthy();

      // blur, force the dropdown to close, then focus again
      // the second focus is simulating the behavior of the Callout when closed
      wrapper.find('.ms-Dropdown').simulate('blur');
      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.escape });
      wrapper.find('.ms-Dropdown').simulate('focus');

      dropdownElement = document.querySelector('.ms-Dropdown-items') as HTMLElement;
      expect(dropdownElement).toBeFalsy();
    });

    it('uses item title attribute if provided', () => {
      const options: IDropdownOption[] = [{ key: 'a', text: 'a', title: 'b' }];
      wrapper = mount(<Dropdown options={options} />);

      wrapper.find('.ms-Dropdown').simulate('click');

      const item = wrapper.find('.ms-Dropdown-item');
      expect(item.getElements()[0].props.title).toBe('b');
    });

    // This is a way to effectively disable setting a title
    it('uses empty string if provided for title', () => {
      const options: IDropdownOption[] = [{ key: 'a', text: 'a', title: '' }];
      wrapper = mount(<Dropdown options={options} />);

      wrapper.find('.ms-Dropdown').simulate('click');

      const item = wrapper.find('.ms-Dropdown-item');
      expect(item.getElements()[0].props.title).toBe('');
    });
  });

  describe('multi-select', () => {
    it('Renders correctly', () => {
      component = create(<Dropdown options={DEFAULT_OPTIONS} multiSelect />);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('Renders correctly when open', () => {
      // Mock createPortal so that the options list ends up inside the wrapper for snapshotting
      spyOn(ReactDOM, 'createPortal').and.callFake(node => node);
      // There's intermittent variation (maybe measurement-related) on different computers,
      // so use fake timers to make it more predictable even though we never advance the timers.
      jest.useFakeTimers();

      const ref = React.createRef<IDropdown>();
      // Specify dropdownWidth to prevent inconsistent calculated widths from getting into the snapshot
      wrapper = mount(<Dropdown multiSelect options={RENDER_OPTIONS} componentRef={ref} dropdownWidth={200} />);
      ref.current!.focus(true);
      wrapper.update();
      expect(wrapper.getDOMNode()).toMatchSnapshot();
    });

    it('Renders correctly when options change', () => {
      wrapper = mount(<Dropdown options={DEFAULT_OPTIONS} multiSelect defaultSelectedKeys={['1', '4']} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');

      expect(titleElement.text()).toEqual('1, 4');

      wrapper.setProps({ options: DEFAULT_OPTIONS.slice(2) });

      wrapper.find('.ms-Dropdown').simulate('click');
      const options = document.querySelectorAll('.ms-Dropdown-item');
      expect(options.length).toEqual(5);
    });

    it('Renders no selected item in default case', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} multiSelect />);

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('');
    });

    it('Renders a selected item if option specifies selected', () => {
      wrapper = mount(
        <Dropdown
          label="testgroup"
          options={[
            { key: '1', text: '1', selected: true },
            { key: '2', text: '2' },
          ]}
          multiSelect
        />,
      );

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1');
    });

    it('sets the selected items even when key is number 0', () => {
      const options = [
        { key: 0, text: 'item1' },
        { key: 1, text: 'item2' },
      ];

      safeCreate(<Dropdown multiSelect options={options} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe(undefined);

        renderer.act(() => {
          container.update(<Dropdown multiSelect options={options} selectedKeys={[0, 1]} />);
        });
        expect(dropdownOptionText.children?.[0]).toBe('item1, item2');
      });
    });

    it('selectedIndices should not contains -1 even when selectedKeys item is not in options', () => {
      const options = [
        { key: 0, text: 'item1' },
        { key: 1, text: 'item2' },
      ];
      const selectedKeys = [0];

      safeCreate(<Dropdown multiSelect options={options} selectedKeys={selectedKeys} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe('item1');

        renderer.act(() => {
          container.update(<Dropdown multiSelect options={options} selectedKeys={[-1]} />);
        });
        expect(dropdownOptionText.children?.[0]).toBe(undefined);
      });
    });

    it('Renders multiple selected items if multiple options specify selected', () => {
      wrapper = mount(
        <Dropdown
          label="testgroup"
          options={[
            { key: '1', text: '1', selected: true },
            { key: '2', text: '2', selected: true },
          ]}
          multiSelect
        />,
      );

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1, 2');
    });

    it('Renders a selected item in uncontrolled case', () => {
      wrapper = mount(
        <Dropdown label="testgroup" defaultSelectedKeys={['1', '2']} multiSelect options={DEFAULT_OPTIONS} />,
      );

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1, 2');
    });

    it('does not change the selected items when defaultSelectedKeys changes', () => {
      wrapper = mount(
        <Dropdown label="testgroup" defaultSelectedKeys={['1', '2']} multiSelect options={DEFAULT_OPTIONS} />,
      );

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1, 2');

      wrapper.setProps({ defaultSelectedKeys: ['3', '4'] });

      expect(titleElement.text()).toEqual('1, 2');
    });

    it('Renders selected items in controlled case', () => {
      wrapper = mount(<Dropdown label="testgroup" selectedKeys={['1', '3']} multiSelect options={DEFAULT_OPTIONS} />);

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1, 3');
    });

    it('changes selected items in controlled case', () => {
      wrapper = mount(<Dropdown label="testgroup" selectedKeys={['1', '3']} multiSelect options={DEFAULT_OPTIONS} />);

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1, 3');

      wrapper.setProps({ selectedKeys: ['2', '4'] });
      expect(titleElement.text()).toEqual('2, 4');
    });

    it("Preserves selected items in controlled case if they don't change", () => {
      wrapper = mount(<Dropdown label="testgroup" selectedKey={'1'} options={DEFAULT_OPTIONS} />);
      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('1');

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelectorAll('.ms-Dropdown-item')[2] as HTMLElement;
      ReactTestUtils.Simulate.click(secondItemElement);

      expect(titleElement.text()).toEqual('1');
    });

    it('Can change items in uncontrolled case', () => {
      wrapper = mount(
        <Dropdown label="testgroup" defaultSelectedKeys={['1']} multiSelect id="test" options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelectorAll(
        '.ms-Dropdown-item > input[type="checkbox"]',
      )[1] as HTMLElement;
      ReactTestUtils.Simulate.change(secondItemElement);

      expect(wrapper.find('.ms-Dropdown-title').text()).toEqual('1, 2');
    });

    it('calls onChange when selecting an item', () => {
      const onChangeSpy = jest.fn();
      wrapper = mount(
        <Dropdown defaultSelectedKeys={['1']} multiSelect onChange={onChangeSpy} options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const secondItemElement = document.querySelectorAll(
        '.ms-Dropdown-item > input[type="checkbox"]',
      )[1] as HTMLElement;
      ReactTestUtils.Simulate.change(secondItemElement);

      expect(onChangeSpy).toHaveBeenCalled();
      // mock.calls is the arguments for each call.
      // The first argument is the event object, which we don't care about.
      expect(onChangeSpy.mock.calls[0].slice(1)).toEqual([{ ...DEFAULT_OPTIONS[2], selected: true }, 2]);
    });

    it('calls onChange when unselecting an item', () => {
      const onChangeSpy = jest.fn();
      wrapper = mount(
        <Dropdown defaultSelectedKeys={['1']} multiSelect onChange={onChangeSpy} options={DEFAULT_OPTIONS} />,
      );

      wrapper.find('.ms-Dropdown').simulate('click');

      const firstItemElement = document.querySelectorAll(
        '.ms-Dropdown-item > input[type="checkbox"]',
      )[0] as HTMLElement;
      ReactTestUtils.Simulate.change(firstItemElement);

      expect(onChangeSpy).toHaveBeenCalled();
      expect(onChangeSpy.mock.calls[0].slice(1)).toEqual([{ ...DEFAULT_OPTIONS[1], selected: false }, 1]);
    });

    it('Will not select the first valid item on keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} multiSelect />);

      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.down });

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('');
    });

    it('Will not select the first valid item on Home keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} multiSelect />);

      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.home });

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('');
    });

    it('Will not select the last valid item on End keypress', () => {
      wrapper = mount(<Dropdown label="testgroup" options={DEFAULT_OPTIONS} multiSelect />);

      wrapper.find('.ms-Dropdown').simulate('keydown', { which: KeyCodes.end });

      const titleElement = wrapper.find('.ms-Dropdown-title');
      expect(titleElement.text()).toEqual('');
    });

    it('Will skip disabled items on keydown', () => {
      const options = [
        { key: 0, text: '1' },
        { key: 1, text: '2', disabled: true },
        { key: 2, text: '3' },
      ];

      wrapper = mount(<Dropdown label="testgroup" options={options} />);
      const dropdownRoot = wrapper.find('.ms-Dropdown');
      const titleElement = wrapper.find('.ms-Dropdown-title');

      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      expect(titleElement.text()).toEqual('1');

      dropdownRoot.simulate('keydown', { which: KeyCodes.down });
      expect(titleElement.text()).toEqual('3');
    });
  });

  describe('Aria attributes', () => {
    it('does not apply aria-labelledby if no label is provided', () => {
      const options = [
        { key: 0, text: '1' },
        { key: 1, text: '2', disabled: true },
        { key: 2, text: '3' },
      ];

      wrapper = mount(<Dropdown options={options} />);
      const dropdownRoot = wrapper.getDOMNode().querySelector('.ms-Dropdown') as HTMLElement;

      expect(dropdownRoot.attributes.getNamedItem('aria-labelledby')).toBeNull();
    });

    it('does not apply aria-labelledby if an empty label is provided', () => {
      const options = [
        { key: 0, text: '1' },
        { key: 1, text: '2', disabled: true },
        { key: 2, text: '3' },
      ];

      wrapper = mount(<Dropdown label="" options={options} />);
      const dropdownRoot = wrapper.getDOMNode().querySelector('.ms-Dropdown') as HTMLElement;

      expect(dropdownRoot.attributes.getNamedItem('aria-labelledby')).toBeNull();
    });

    it('applies aria-labelledby if a non-empty label is provided', () => {
      const options = [
        { key: 0, text: '1' },
        { key: 1, text: '2', disabled: true },
        { key: 2, text: '3' },
      ];

      wrapper = mount(<Dropdown label="Test label" options={options} />);
      const dropdownRoot = wrapper.getDOMNode().querySelector('.ms-Dropdown') as HTMLElement;

      expect(dropdownRoot.attributes.getNamedItem('aria-labelledby')).not.toBeNull();
    });

    it('sets role=error on included error message', () => {
      wrapper = mount(
        <Dropdown label="Test label" options={[]} id="sample-dropdown" errorMessage="This is an example error." />,
      );
      const errorMessage = wrapper.getDOMNode().querySelector('#sample-dropdown-errorMessage') as HTMLElement;
      expect(errorMessage.getAttribute('role')).toEqual('alert');
    });
  });

  describe('with simulated async loaded options', () => {
    /** See https://github.com/microsoft/fluentui/issues/7315 */
    class DropdownWithChangingProps extends React.Component<{ multi: boolean }, { options?: IDropdownOption[] }> {
      public state = {
        options: undefined,
      };

      public componentDidMount() {
        this.loadOptions();
      }

      public render() {
        return (
          <div className="docs-DropdownExample">
            {this.props.multi ? (
              <Dropdown
                label="Basic uncontrolled example:"
                defaultSelectedKeys={['B', 'D']}
                options={this.state.options!}
                multiSelect
              />
            ) : (
              <Dropdown label="Basic uncontrolled example:" defaultSelectedKey={'B'} options={this.state.options!} />
            )}
          </div>
        );
      }

      public loadOptions() {
        this.setState({
          options: [
            { key: 'A', text: 'Option a', title: 'I am option a.' },
            { key: 'B', text: 'Option b' },
            { key: 'C', text: 'Option c', disabled: true },
            { key: 'D', text: 'Option d' },
            { key: 'E', text: 'Option e' },
          ],
        });
      }
    }

    it('defaultSelectedKey value is respected if Dropdown options change for single-select Dropdown.', () => {
      safeCreate(<DropdownWithChangingProps multi={false} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe('Option b');
      });
    });

    it('defaultSelectedKeys value is respected if Dropdown options change for multi-select Dropdown.', () => {
      safeCreate(<DropdownWithChangingProps multi={true} />, container => {
        const dropdownOptionText = container.root.find(node => {
          return node.props.className?.includes?.('ms-Dropdown-title');
        });
        expect(dropdownOptionText.children?.[0]).toBe('Option b, Option d');
      });
    });
  });
});
