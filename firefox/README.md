_(中文版见底部)_

Encrypt Image
=============

Here is a Firefox extension for encrypting image. Differenting from most
encrypting methods, which takes the binary data of an image file as input and
produces a mess of pseudo-random bytes as output, this plugin used another
approach: jigsaw. The image is divided into 8x8 pieces and the pieces are
messed up using cryptographical means. The result is another mosaic image,
possibly the same size of the original, and fits into any social networking
websites like facebook, weibo, etc.

This may not be a really secure encryption, but nor should it be easy to crack.
Each piece may have been mirrored either or both horizontally and vertically,
and their layers of colors: red, green, blue are possibly inverted.

The plugin have made it very easy to perform encrypt and decrypt: right click
on an image, and use the new items in the menu to do it!

TODOs, or currently existing issues
-----------------------------------

0. Support for private browsing mode should be discussed and possibly added.


------------------------------------------------------------------------------

Encrypt Image(加密图片)
=======================

这是一个用来加密图片的火狐浏览器扩展。和其他的直接加密图片的二进制数据文件并
产生乱七八糟的二进制文件不同，这个扩展使用拼图方式处理图片。图片首先被拆分成
8×8尺寸的方块，然后用密码方法打乱这些方块。这样做的结果是一种类似马赛克一样的
图片，尺寸和原图一样，并因此可以无障碍地上传到任何社交网络中，例如Facebook或者
微博。

这虽然不是真正意义上的加密，但是破解也不会非常简单。任何一个方块都可能被垂直
和/或水平镜像，并且三个图层（红、绿、蓝）也可能被反相。

本插件十分易于使用：直接在网页上用鼠标右键点击一个图片，然后找到新添加进来的选
项进行操作即可。

要做的事项
----------

0. 需要讨论并添加隐私浏览模式下的支持。
