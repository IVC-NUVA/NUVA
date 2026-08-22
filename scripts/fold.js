function initFolded ()
{
var foldables = document.querySelectorAll('.folded');

for (var i = 0; i < foldables.length; ++i)
{ foldables[i].onclick=function() {
var ul=this.parentElement.querySelectorAll('ul')[0];
if (ul.style.display == 'block')   // Line was expanded
  { ul.style.display='none' ;
    this.className = 'folded';
   }
else {
	ul.style.display='block' ;
	this.className = 'unfolded'
	var children=ul.querySelectorAll('li');
	for (var j=0; j<children.length;j++)
	{
	  child = children[j];
	  item = child.querySelectorAll('span')[0]
	  if (item.className == 'unfolded')
	  {
		item.className = 'folded';
		ul2 = child.querySelectorAll('ul')[0]
		ul2.style.display = 'none'
	  }
	}
} }
 }
}